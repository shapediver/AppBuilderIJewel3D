import { ShapeDiverResponseOutputContent } from "@shapediver/sdk.geometry-api-sdk-v2";
import { ISessionApi, SessionOutputData } from "@shapediver/viewer.session";
import { CoreViewerApp, MathUtils, IModel, Mesh, Sphere } from "webgi";
import { staticMaterialDatabase } from "./staticMaterialDatabase";

const _models: Record<string, IModel[][]> = {};
let _loadedOutputVersions: { [key: string]: string } = {};
let _dynamicMaterialDatabase: { [key: string]: unknown } = {};
let _loadedMaterialOutputVersion: string | undefined;
let _initialFitToView = true;

export const processMaterialDatabase = async (
	sessionApi: ISessionApi
) => {
	// first, search for the MaterialDatabase output and update the dynamicMaterialDatabase
	const materialDatabaseOutput = Object.keys(sessionApi.outputs).find((outputId) => {
		const output = sessionApi.outputs[outputId];
		if (output.name === "MaterialDatabase" || output.displayname === "MaterialDatabase")
			return true;

		return false;
	});

	/**
		 * If the MaterialDatabase output is found, create a callback that updates the dynamicMaterialDatabase.
		 * This callback is called when the MaterialDatabase output is updated.
		 */
	if (materialDatabaseOutput) {
		const outputApi = sessionApi.outputs[materialDatabaseOutput];

		if (_loadedMaterialOutputVersion !== outputApi.version) {
			// update the dynamic material database
			_dynamicMaterialDatabase = (outputApi.node?.data.find((d) => d instanceof SessionOutputData) as SessionOutputData).responseOutput.content?.[0].data;

			// clear the loaded output versions so that the new material definitions are applied
			_loadedOutputVersions = {};

			// store the version of the output
			_loadedMaterialOutputVersion = outputApi.version;
		}
	}
};

export const processOutputs = async (
	viewport: CoreViewerApp | undefined,
	sessionApi: ISessionApi
) => {
	const parameters = new URLSearchParams(window.location.search);
	const zoomTo = parameters.get("webgiZoomTo");

	// iterate over all other outputs
	for (const outputId in sessionApi.outputs) {
		const outputApi = sessionApi.outputs[outputId];

		// if the output is already loaded, skip it
		if (_loadedOutputVersions[outputId] === outputApi.version) continue;
		// skip the MaterialDatabase output, this output is handled separately
		if (outputApi.name === "MaterialDatabase" || outputApi.displayname === "MaterialDatabase") continue;

		// iterate over all content in the output and load the glb content
		const content = outputApi.content;
		if (!content?.length) continue;
		for (let i = 0; i < content.length; i++) {
			const item = content[i];

			switch (item.format) {
			case "gltf":
			case "glb":
				await loadGlbContent(viewport, outputApi.name, outputApi.uid, item, i);
			}
		}

		// store the version of the output
		_loadedOutputVersions[outputId] = outputApi.version;
	}

	// scale the model to fit the viewport
	if(viewport) {
		// get the bounding sphere of the model
		const modelBounds = viewport.scene.getModelBounds();
		const boundingSphere = new Sphere();
		modelBounds.getBoundingSphere(boundingSphere);
		// set the right scalar for the model root
		const scale = 4 / boundingSphere.radius;
		viewport.scene.modelRoot.scale.setScalar(scale);
		viewport.scene.setDirty();
	}

	if((_initialFitToView && viewport) || (viewport && zoomTo === "true")) {
		viewport.fitToView();
		_initialFitToView = false;
	}
};

/**
 * Load a glb content into the viewer
 * 
 * Store the model in the models dictionary.
 * Apply the material to the model.
 * 
 * @param outputName The name of the output
 * @param outputUid The uid of the output (if it exists)
 * @param content The content of the output
 * @param index The index of the content
 * @returns 
 */
const loadGlbContent = async (
	viewport: CoreViewerApp | undefined,
	outputName: string,
	outputUid: string | undefined,
	content: ShapeDiverResponseOutputContent,
	index: number
): Promise<void> => {
	if (!viewport) return;

	// use the original uid if it exists, otherwise generate a new one
	const uid = outputUid || MathUtils.generateUUID();

	// load the model
	const ms = await viewport.load(content.href + "#f" + index + ".glb", { autoScale: false, pseudoCenter: false });
	ms.name = outputName;

	// dispose the old model
	if (_models && _models[uid] && _models[uid][index]) {
		_models[uid][index].forEach((m: IModel) => m.modelObject.dispose());
		_models[uid][index] = [];
	}

	// store the new model
	if (!_models[uid]) _models[uid] = [];
	_models[uid][index] = [ms];

	// // apply the material
	await applyMaterial(viewport, ms);
};

const applyMaterial = async (viewport: CoreViewerApp, ms: IModel) => {
	const promises: Promise<void>[] = [];

	// for every object in the model, check if it belongs to a defined material library
	// if it does, store it in the material library
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	ms.modelObject.traverse((child: Mesh<any, any>) => {
		if (!child.material) return;

		// check if the material name is in the dynamic material database
		for (const key in _dynamicMaterialDatabase) {
			if (child.material.name === key) {
				const def = _dynamicMaterialDatabase[key];
				const materialDefinition = typeof def === "string" ? JSON.parse(def as string) : def;
				promises.push(createMaterialFromDefinition(viewport, child, materialDefinition));

				return;
			}
		}

		// check if the material name is in the static material database
		for (const key in staticMaterialDatabase) {
			if (child.material.name === key) {
				promises.push(createMaterialFromDefinition(viewport, child, staticMaterialDatabase[key]));

				return;
			}
		}
	});

	await Promise.all(promises);
};

const createMaterialFromDefinition = async (viewer: CoreViewerApp, child: Mesh<any, any>, definition: any) => {
	const materialType = definition.type;

	if (materialType === "DiamondMaterial") {
		// Regarding the DiamondPlugin, please read more here: https://webgi.xyz/docs/industries/jewellery/index.html
		const file = new File([JSON.stringify(definition)], child.material.name + ".dmat", { type: "application/json", });
		const material = await viewer.load({ file: file, path: child.material.name + ".dmat" });
		(child as any).setMaterial(material);
	} else if (materialType === "MeshStandardMaterial2") {
		const file = new File([JSON.stringify(definition)], child.material.name + ".pmat", { type: "application/json", });
		const material = await viewer.load({ file: file, path: child.material.name + ".pmat" });
		(child as any).setMaterial(material);
	}
};