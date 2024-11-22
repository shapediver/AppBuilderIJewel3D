

const _loadedOutputVersions: { [key: string]: string } = {};
const _models: Record<string, IModel[][]> = {};


import { ShapeDiverResponseOutputContent } from "@shapediver/sdk.geometry-api-sdk-v2";
import { ITreeNode, SessionApiData } from "@shapediver/viewer.session";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import AppBuilderContainerComponent from "shared/components/shapediver/appbuilder/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent from "shared/components/shapediver/appbuilder/AppBuilderFallbackContainerComponent";
import MarkdownWidgetComponent from "shared/components/shapediver/ui/MarkdownWidgetComponent";

import { ComponentContext } from "shared/context/ComponentContext";
import useAppBuilderSettings from "shared/hooks/shapediver/appbuilder/useAppBuilderSettings";
import { useSessionWithAppBuilder } from "shared/hooks/shapediver/appbuilder/useSessionWithAppBuilder";
import { useParameterHistory } from "shared/hooks/shapediver/parameters/useParameterHistory";
import { useSessionPropsExport } from "shared/hooks/shapediver/parameters/useSessionPropsExport";
import { useSessionPropsParameter } from "shared/hooks/shapediver/parameters/useSessionPropsParameter";
import useDefaultSessionDto from "shared/hooks/shapediver/useDefaultSessionDto";
import { useKeyBindings } from "shared/hooks/shapediver/useKeyBindings";
import { SessionUpdateCallbackHandler } from "shared/hooks/shapediver/viewer/useSessionUpdateCallback";
import { useViewportId } from "shared/hooks/shapediver/viewer/useViewportId";
import AlertPage from "shared/pages/misc/AlertPage";
import LoaderPage from "shared/pages/misc/LoaderPage";
import AppBuilderTemplateSelector from "shared/pages/templates/AppBuilderTemplateSelector";
import { useShapeDiverStoreSession } from "shared/store/useShapeDiverStoreSession";
import { IAppBuilderTemplatePageContainerHints, IAppBuilderTemplatePageProps } from "shared/types/pages/appbuildertemplates";
import { IAppBuilderSettingsSession, IAppBuilderContainer } from "shared/types/shapediver/appbuilder";
import { shouldUsePlatform } from "shared/utils/platform/environment";
import { IModel, CoreViewerApp, MathUtils } from "webgi";
import { useWebGiStoreViewport } from "webgi/store/webgiViewportStore";


const WelcomePlatformMarkdown = `
## Hello
`;

const WelcomeIframeMarkdown = `
## Welcome to the ShapeDiver App Builder`;

const WelcomeLocalhostMarkdown = ` 
## Welcome to the ShapeDiver App Builder again`;

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

/**
 * Create rendering hints for the container.
 * @param container 
 * @returns 
 */
const createContainerHints = (container: IAppBuilderContainer): IAppBuilderTemplatePageContainerHints | undefined => {
	// if the bottom container contains tabs, prefer vertical layout
	if (container.name === "bottom" && container.tabs && container.tabs.length > 0) {
		return {
			preferVertical: true
		};
	}
};

/**
 * Function that creates the web app page.
 *
 * @returns
 */
export default function WebGiExamplePage(props: Partial<Props>) {

	// get default session dto, if any
	const { defaultSessionDto } = useDefaultSessionDto(props);

	// get the component context to get the correct viewport
	const componentContext = useContext(ComponentContext);
	const {
		viewportComponent: { component: ViewportComponent } = {},
		viewportOverlayWrapper: { component: ViewportOverlayWrapper } = {},
		viewportIcons: { component: ViewportIcons } = {}
	} = componentContext;

	// get settings for app builder from query string
	const { settings, error: settingsError, loading, hasSettings, hasSession } = useAppBuilderSettings(defaultSessionDto);

	// for now we only make use of the first session in the settings
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const { namespace, sessionApi, error: appBuilderError, hasAppBuilderOutput, appBuilderData } = useSessionWithAppBuilder(sessionDto, settings?.appBuilderOverride);
	const error = settingsError ?? appBuilderError;

	// get props for fallback parameters
	const parameterProps = useSessionPropsParameter(namespace);
	const exportProps = useSessionPropsExport(namespace);

	// create UI elements for containers
	const containers: IAppBuilderTemplatePageProps = {
		top: undefined,
		bottom: undefined,
		left: undefined,
		right: undefined,
	};

	// should fallback containers be shown?
	const showFallbackContainers = settings?.settings?.disableFallbackUi !== true;

	if (appBuilderData?.containers) {
		appBuilderData.containers.forEach((container) => {
			containers[container.name] = {
				node: <AppBuilderContainerComponent namespace={namespace} {...container} />,
				hints: createContainerHints(container)
			};
		});
	}
	else if (!hasAppBuilderOutput
		&& (parameterProps.length > 0 || exportProps.length > 0)
		&& showFallbackContainers
	) {
		containers.right = {
			node: <AppBuilderFallbackContainerComponent parameters={parameterProps} exports={exportProps} />
		};
	}

	const show = !!sessionApi;

	// use parameter history
	useParameterHistory({ loaded: show });

	// key bindings
	useKeyBindings({ namespace });

	const showMarkdown = !(settings && hasSession) // no settings or no session
		&& !loading // not loading
		&& !error // no error
		&& !(hasSettings && hasSession); // there are no query string parameters or no session

	const NoSettingsMarkdown = window.location.hostname === "localhost" ?
		WelcomeLocalhostMarkdown :
		shouldUsePlatform() ? WelcomePlatformMarkdown : WelcomeIframeMarkdown;







	const {viewportId} = useViewportId();
	const viewport = useWebGiStoreViewport(store => store.viewports[viewportId]);
	const viewportRef = useRef<CoreViewerApp | undefined>(viewport);

	const callback = useCallback((newNode?: ITreeNode, oldNode?: ITreeNode) => {
		if(!viewportRef.current) return;
		if (!newNode) return;

		const sessionApiData = newNode.data.find((data) => data instanceof SessionApiData) as SessionApiData;
		if (!sessionApiData) return;

		const sessionApi = sessionApiData.api;

		// // first, search for the MaterialDatabase output and update the dynamicMaterialDatabase
		// const materialDatabaseOutput = Object.keys(this._session.outputs).find((outputId) => {
		// 	const output = this._session!.outputs[outputId];
		// 	if (output.name === 'MaterialDatabase' || output.displayname === 'MaterialDatabase')
		// 		return true;
		// 	return false;
		// });

		// /**
		//  * If the MaterialDatabase output is found, create a callback that updates the dynamicMaterialDatabase.
		//  * This callback is called when the MaterialDatabase output is updated.
		//  */
		// if (materialDatabaseOutput) {
		// 	const outputApi = this._session.outputs[materialDatabaseOutput];

		// 	if (this._loadedMaterialOutputVersion !== outputApi.version) {
		// 		// update the dynamic material database
		// 		this._dynamicMaterialDatabase = (outputApi.node?.data.find((d) => d instanceof SessionOutputData) as SessionOutputData).responseOutput.content?.[0].data;

		// 		// clear the loaded output versions so that the new material definitions are applied
		// 		this._loadedOutputVersions = {};

		// 		// store the version of the output
		// 		this._loadedMaterialOutputVersion = outputApi.version;
		// 	}
		// }

		// disable rendering while loading the model
		if (viewportRef.current) viewportRef.current.renderEnabled = false;

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
					loadGlbContent(viewportRef.current, outputApi.name, outputApi.uid, item, i);
				}
			}

			// store the version of the output
			_loadedOutputVersions[outputId] = outputApi.version;
		}

		// enable rendering again
		if (viewportRef.current) viewportRef.current.renderEnabled = true;
	}, []);

	const sessions = useShapeDiverStoreSession(store => store.sessions);
	const [sessionUpdateCallbackHandlers, setSessionUpdateCallbackHandlers] = useState<JSX.Element[]>([]);

	
	useEffect(() => {
		viewportRef.current = viewport;

		Object.values(sessions).forEach(sessionApi => {
			if(sessionApi.updateCallback) sessionApi.updateCallback(sessionApi.node, sessionApi.node);
		});
	}, [viewport]);

	useEffect(() => {
		const sessionUpdateCallbackHandlers: JSX.Element[] = [];

		Object.keys(sessions).forEach(sessionId => {
			sessionUpdateCallbackHandlers.push(
				<SessionUpdateCallbackHandler
					key={sessionId}
					sessionId={sessionId}
					callbackId={sessionId}
					updateCallback={callback}
				/>);
		});

		setSessionUpdateCallbackHandlers(sessionUpdateCallbackHandlers);
	}, [sessions]);

	return (
		showMarkdown ? <AlertPage>
			<MarkdownWidgetComponent anchorTarget="_self">
				{NoSettingsMarkdown}
			</MarkdownWidgetComponent>
		</AlertPage> :
			error ? <AlertPage title="Error">{error.message}</AlertPage> :
				loading || !show ? <LoaderPage /> : // TODO smooth transition between loading and showing
					show ? <AppBuilderTemplateSelector
						top={containers.top}
						left={containers.left}
						right={containers.right}
						bottom={containers.bottom}
					>
						{sessionUpdateCallbackHandlers}
						{ViewportComponent && <ViewportComponent>
							{ViewportOverlayWrapper && <ViewportOverlayWrapper>
								{ViewportIcons && <ViewportIcons />}
							</ViewportOverlayWrapper>}
						</ViewportComponent>}

					</AppBuilderTemplateSelector>
						: <></>
	);
}



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
	// await this.applyMaterial(viewport, ms);

	return viewport.fitToView();
};