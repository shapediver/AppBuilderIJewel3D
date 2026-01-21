import NotificationWrapper from "@AppBuilderShared/components/ui/NotificationWrapper";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useCustomTheme} from "@AppBuilderShared/hooks/ui/useCustomTheme";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
import {useShapeDiverStoreProcessManager} from "@AppBuilderShared/store/useShapeDiverStoreProcessManager";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import "@mantine/charts/styles.css";
import {MantineProvider} from "@mantine/core";
import "@mantine/core/styles.css";
import {Notifications} from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import {
	addListener,
	EventResponseMapping,
	EVENTTYPE_TASK,
	IEvent,
	ITreeNode,
	removeListener,
	SessionApiData,
	SessionData,
	SessionOutputData,
	TASK_CATEGORY,
	TASK_TYPE,
} from "@shapediver/viewer.session";
import {useWebGiStoreViewport} from "@webgi/store/webgiViewportStore";
import {
	processInstances,
	processMaterialDatabase,
	processOutputs,
} from "@webgi/utils/webGiProcessingUtils";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {CoreViewerApp, LoadingScreenPlugin} from "webgi";
import packagejson from "../package.json";
import "./AppBuilderBase.css";

console.log(`ShapeDiver App Builder SDK v${packagejson.version}`);

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewerSession;
	}
}

export default function AppBuilderBase() {
	useEffect(() => {
		window.SDV = ShapeDiverViewerSession;
	}, []);

	const {theme, resolver} = useCustomTheme();

	const {viewportId} = useViewportId();
	const viewport = useWebGiStoreViewport(
		(store) => store.viewports[viewportId],
	);
	const viewportRef = useRef<CoreViewerApp | undefined>(viewport);
	const sessions = useShapeDiverStoreSession((store) => store.sessions);
	const sessionsRef = useRef(sessions);
	const processManagers = useShapeDiverStoreProcessManager(
		(store) => store.processManagers,
	);

	const [initialFitToView, setInitialFitToView] = useState(true);
	const [processingCount, setProcessingCount] = useState(0);

	useEffect(() => {
		sessionsRef.current = sessions;
	}, [sessions]);

	useEffect(() => {
		const parameters = new URLSearchParams(window.location.search);
		const zoomTo = parameters.get("webgiZoomTo");
		if (
			viewportRef.current &&
			viewportRef.current.renderEnabled === true &&
			Object.keys(processManagers).length === 0 &&
			(initialFitToView || zoomTo === "true")
		) {
			viewportRef.current.fitToView();
			setInitialFitToView(false);
		}
	}, [
		processManagers,
		initialFitToView,
		processingCount,
		viewportRef.current?.renderEnabled,
	]);

	const callback = useCallback(async (newNode?: ITreeNode) => {
		if (!viewportRef.current || !newNode) return;

		const sessionApiData = newNode.data.find(
			(data) => data instanceof SessionApiData,
		) as SessionApiData;
		if (!sessionApiData) return;

		// disable rendering while loading the model
		if (viewportRef.current) viewportRef.current.renderEnabled = false;

		const sessionApi = sessionApiData.api;

		// process the material database
		await processMaterialDatabase(sessionApi);

		// find all SessionOutputData of the outputs
		const outputs: {[key: string]: SessionOutputData} = {};
		for (const outputId in sessionApi.outputs) {
			const output = sessionApi.outputs[outputId];
			const sessionOutputData = output.node?.data.find(
				(d) => d instanceof SessionOutputData,
			) as SessionOutputData;
			if (sessionOutputData) outputs[outputId] = sessionOutputData;
		}

		await processOutputs(viewportRef.current, outputs);
		await processInstances(viewportRef.current, sessionApi);

		// enable rendering again
		if (viewportRef.current) viewportRef.current.renderEnabled = true;

		newNode.updateCallback = () => {
			callback(newNode);
		};

		setProcessingCount((count) => count - 1);
	}, []);

	useEffect(() => {
		viewportRef.current = viewport;
		if (!viewport) return;

		const eventListenerTokenTaskStart = addListener(
			EVENTTYPE_TASK.TASK_START,
			(e: IEvent) => {
				const event =
					e as EventResponseMapping[EVENTTYPE_TASK.TASK_START];
				if (
					event.type === TASK_TYPE.SESSION_CUSTOMIZATION &&
					(event.category ===
						TASK_CATEGORY.SESSION_CUSTOMIZATION.CUSTOMIZE ||
						event.category ===
							TASK_CATEGORY.SESSION_CUSTOMIZATION
								.CUSTOMIZE_VIA_EXPORTS)
				) {
					(
						viewportRef.current!.getPlugin(
							LoadingScreenPlugin as any,
						)! as LoadingScreenPlugin
					).show();
				}
			},
		);
		const eventListenerTokenTaskEnd = addListener(
			EVENTTYPE_TASK.TASK_END,
			(e: IEvent) => {
				const event =
					e as EventResponseMapping[EVENTTYPE_TASK.TASK_END];
				if (
					event.type === TASK_TYPE.SESSION_CUSTOMIZATION &&
					(event.category ===
						TASK_CATEGORY.SESSION_CUSTOMIZATION.CUSTOMIZE ||
						event.category ===
							TASK_CATEGORY.SESSION_CUSTOMIZATION
								.CUSTOMIZE_VIA_EXPORTS)
				) {
					(
						viewportRef.current!.getPlugin(
							LoadingScreenPlugin as any,
						)! as LoadingScreenPlugin
					).hide();

					Object.values(sessionsRef.current).forEach((sessionApi) => {
						const sessionData = sessionApi.node.data.find(
							(data) => data instanceof SessionData,
						);
						if (
							sessionData !== undefined &&
							sessionData.instance !== true
						)
							callback(sessionApi.node);
					});
				}
			},
		);
		const eventListenerTokenTaskCancel = addListener(
			EVENTTYPE_TASK.TASK_CANCEL,
			(e: IEvent) => {
				const event =
					e as EventResponseMapping[EVENTTYPE_TASK.TASK_CANCEL];
				if (
					event.type === TASK_TYPE.SESSION_CUSTOMIZATION &&
					(event.category ===
						TASK_CATEGORY.SESSION_CUSTOMIZATION.CUSTOMIZE ||
						event.category ===
							TASK_CATEGORY.SESSION_CUSTOMIZATION
								.CUSTOMIZE_VIA_EXPORTS)
				) {
					(
						viewportRef.current!.getPlugin(
							LoadingScreenPlugin as any,
						)! as LoadingScreenPlugin
					).hide();
				}
			},
		);

		Object.values(sessionsRef.current).forEach((sessionApi) => {
			const sessionData = sessionApi.node.data.find(
				(data) => data instanceof SessionData,
			);

			if (sessionData !== undefined && sessionData.instance !== true)
				callback(sessionApi.node);
		});

		return () => {
			removeListener(eventListenerTokenTaskStart);
			removeListener(eventListenerTokenTaskEnd);
			removeListener(eventListenerTokenTaskCancel);
		};
	}, [viewport]);

	return (
		<MantineProvider
			defaultColorScheme="auto"
			forceColorScheme={theme.other?.forceColorScheme}
			theme={theme}
			cssVariablesResolver={resolver}
		>
			<Notifications />
			<NotificationWrapper>
				<AppBuilderPage />
			</NotificationWrapper>
		</MantineProvider>
	);
}
