import {ResOutputContent} from "@shapediver/sdk.geometry-api-sdk-v2";
import {
	ISessionApi,
	ITreeNode,
	SessionData,
	SessionOutputData,
} from "@shapediver/viewer.session";
import {
	CoreViewerApp,
	IModel,
	MathUtils,
	Matrix4,
	Mesh,
	Object3D,
	Sphere,
} from "webgi";
import {staticMaterialDatabase} from "./staticMaterialDatabase";

const _models: Record<string, IModel[][]> = {};
let _loadedOutputVersions: {
	[key: string]: {
		version: string;
		models: IModel[];
	};
} = {};
let _dynamicMaterialDatabase: {[key: string]: unknown} = {};
let _loadedMaterialOutputVersion: string | undefined;
let _mainInstanceNode: Object3D | undefined;

export const processMaterialDatabase = async (sessionApi: ISessionApi) => {
	// first, search for the MaterialDatabase output and update the dynamicMaterialDatabase
	const materialDatabaseOutput = Object.keys(sessionApi.outputs).find(
		(outputId) => {
			const output = sessionApi.outputs[outputId];
			if (
				output.name === "MaterialDatabase" ||
				output.displayname === "MaterialDatabase"
			)
				return true;

			return false;
		},
	);

	/**
	 * If the MaterialDatabase output is found, create a callback that updates the dynamicMaterialDatabase.
	 * This callback is called when the MaterialDatabase output is updated.
	 */
	if (materialDatabaseOutput) {
		const outputApi = sessionApi.outputs[materialDatabaseOutput];

		if (_loadedMaterialOutputVersion !== outputApi.version) {
			// update the dynamic material database
			_dynamicMaterialDatabase = (
				outputApi.node?.data.find(
					(d) => d instanceof SessionOutputData,
				) as SessionOutputData
			).responseOutput.content?.[0].data;

			// clear the loaded output versions so that the new material definitions are applied
			_loadedOutputVersions = {};

			// store the version of the output
			_loadedMaterialOutputVersion = outputApi.version;
		}
	}
};

export const processInstances = async (
	viewport: CoreViewerApp | undefined,
	sessionApi: ISessionApi,
) => {
	if (!_mainInstanceNode) {
		_mainInstanceNode = new Object3D();
		_mainInstanceNode.name = "Instances";
		viewport?.scene.modelRoot.add(_mainInstanceNode);
	} else {
		// clear the main instance node and remove all children
		_mainInstanceNode.clear();
		while (_mainInstanceNode.children.length > 0) {
			// clear the data of the child nodes
			(_mainInstanceNode.children[0] as any).dispose();
			_mainInstanceNode.remove(_mainInstanceNode.children[0]);
		}
	}

	// check all the children of the sessionApi.node for instances
	for (const childNode of sessionApi.node.children) {
		const instances: ITreeNode[] = [];
		// traverse the child nodes to find instances
		childNode.traverse((node) => {
			for (const data of node.data)
				if (data instanceof SessionData) instances.push(node);
		});

		// for each instance, we need to create a node for the instance
		// and nodes for each transformation
		// we need to convert the transformation matrix from gl-matrix to three.js matrix
		// then we can call the processOutputs function to load the models
		for (const instanceNode of instances) {
			const instanceObject = new Object3D();
			instanceObject.name =
				instanceNode.originalName || instanceNode.name;

			// for each child of the instance node, create a transformation node
			for (const child of instanceNode.children) {
				const transformationObject = new Object3D();
				transformationObject.name = child.originalName || child.name;
				// get the transformation matrix from gl-matrix format to three.js format
				const matrices = child.transformations.map((t) => t.matrix);
				// apply the transformation matrices to the transformation node
				for (const matrix of matrices) {
					const threeMatrix = new Matrix4();
					threeMatrix.set(
						matrix[0],
						matrix[4],
						matrix[8],
						matrix[12],
						matrix[1],
						matrix[5],
						matrix[9],
						matrix[13],
						matrix[2],
						matrix[6],
						matrix[10],
						matrix[14],
						matrix[3],
						matrix[7],
						matrix[11],
						matrix[15],
					);
					transformationObject.applyMatrix4(threeMatrix);
				}
				instanceObject.add(transformationObject);

				const outputs: {[outputId: string]: SessionOutputData} = {};
				child.traverseData((data) => {
					if (data instanceof SessionOutputData) {
						const sessionOutputData = data as SessionOutputData;
						const outputId = sessionOutputData.id;
						if (outputId && !(outputId in outputs)) {
							outputs[outputId] = sessionOutputData;
						}
					}
				});

				// each child of the transformation node needs to load the outputs
				const loaded = await processOutputs(viewport, outputs, false);

				// add all loaded models to the transformation object
				for (const outputId in loaded) {
					const models = loaded[outputId];
					for (const model of models)
						transformationObject.add(model.modelObject.clone());
				}
				instanceObject.add(transformationObject);
			}
			_mainInstanceNode.add(instanceObject);
		}
	}
};

export const processOutputs = async (
	viewport: CoreViewerApp | undefined,
	outputs: {[outputId: string]: SessionOutputData},
	addToRoot: boolean = true,
): Promise<{[outputId: string]: IModel[]}> => {
	const loadedOutputs: {[outputId: string]: IModel[]} = {};

	// iterate over all other outputs
	for (const outputId in outputs) {
		const outputData = outputs[outputId].responseOutput;

		// if the output is already loaded, skip it
		if (_loadedOutputVersions[outputId]?.version === outputData.version) {
			loadedOutputs[outputId] = _loadedOutputVersions[outputId].models;
			continue;
		}
		// skip the MaterialDatabase output, this output is handled separately
		if (
			outputData.name === "MaterialDatabase" ||
			outputData.displayname === "MaterialDatabase"
		)
			continue;

		// iterate over all content in the output and load the glb content
		const content = outputData.content;
		if (!content?.length) continue;

		const models: IModel[] = [];
		for (let i = 0; i < content.length; i++) {
			const item = content[i];

			switch (item.format) {
				case "gltf":
				case "glb": {
					const model = await loadGlbContent(
						viewport,
						outputData.name,
						outputData.uid,
						item,
						i,
						addToRoot,
					);
					if (model) models.push(model);
				}
			}
		}

		// store the version of the output
		_loadedOutputVersions[outputId] = {
			version: outputData.version,
			models: models,
		};
		loadedOutputs[outputId] = models;
	}

	// scale the model to fit the viewport
	if (viewport) {
		viewport.scene.modelRoot.scale.setScalar(1);
		// get the bounding sphere of the model
		const modelBounds = viewport.scene.getModelBounds();
		const boundingSphere = new Sphere();
		modelBounds.getBoundingSphere(boundingSphere);
		// set the right scalar for the model root
		const scale = 2 / boundingSphere.radius;
		viewport.scene.modelRoot.scale.setScalar(scale);
		viewport.scene.setDirty();
	}

	return loadedOutputs;
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
	content: ResOutputContent,
	index: number,
	addToRoot: boolean = true,
): Promise<IModel | undefined> => {
	if (!viewport) return;

	// use the original uid if it exists, otherwise generate a new one
	const uid = outputUid || MathUtils.generateUUID();

	let ms: IModel | undefined;
	if (addToRoot) {
		// load the model
		ms = await viewport.load(content.href + "#f" + index + ".glb", {
			autoScale: false,
			pseudoCenter: false,
		});
	} else {
		ms = (await viewport
			.getManager()!
			.importer!.importSingle(content.href + "#f" + index + ".glb", {
				autoScale: false,
				pseudoCenter: false,
				waitForFullLoad: true,
			})) as unknown as IModel;
	}
	if (!ms) return;
	ms.name = outputName;

	// dispose the old model
	if (_models && _models[uid] && _models[uid][index]) {
		_models[uid][index].forEach((m: IModel) => m.modelObject.dispose());
		_models[uid][index] = [];
	}

	// store the new model
	if (!_models[uid]) _models[uid] = [];
	_models[uid][index] = [ms];

	// apply the material
	await applyMaterial(viewport, ms);

	return ms;
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
				const materialDefinition =
					typeof def === "string" ? JSON.parse(def as string) : def;
				promises.push(
					createMaterialFromDefinition(
						viewport,
						child,
						materialDefinition,
					),
				);

				return;
			}
		}

		// check if the material name is in the static material database
		for (const key in staticMaterialDatabase) {
			if (child.material.name === key) {
				promises.push(
					createMaterialFromDefinition(
						viewport,
						child,
						staticMaterialDatabase[key],
					),
				);

				return;
			}
		}
	});

	await Promise.all(promises);
};

const createMaterialFromDefinition = async (
	viewer: CoreViewerApp,
	child: Mesh<any, any>,
	definition: any,
) => {
	const materialType = definition.type;

	if (materialType === "DiamondMaterial") {
		// Regarding the DiamondPlugin, please read more here: https://webgi.xyz/docs/industries/jewellery/index.html
		const file = new File(
			[JSON.stringify(definition)],
			child.material.name + ".dmat",
			{type: "application/json"},
		);
		const material = await viewer.load({
			file: file,
			path: child.material.name + ".dmat",
		});
		material.name = child.material.name;
		(child as any).setMaterial(material);
	} else if (materialType === "MeshStandardMaterial2") {
		const file = new File(
			[JSON.stringify(definition)],
			child.material.name + ".pmat",
			{type: "application/json"},
		);
		const material = await viewer.load({
			file: file,
			path: child.material.name + ".pmat",
		});
		(child as any).setMaterial(material);
	}
};
