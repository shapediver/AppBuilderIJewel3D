import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import AppBuilderPage from "shared/pages/appbuilder/AppBuilderPage";
import { useCustomTheme } from "shared/hooks/ui/useCustomTheme";
import packagejson from "../package.json";
import { Notifications } from "@mantine/notifications";
import "AppBuilderBase.css";
import NotificationWrapper from "shared/components/ui/NotificationWrapper";
import { SessionUpdateCallbackHandler } from "shared/hooks/shapediver/viewer/useSessionUpdateCallback";
import { useViewportId } from "shared/hooks/shapediver/viewer/useViewportId";
import { useShapeDiverStoreSession } from "shared/store/useShapeDiverStoreSession";
import { CoreViewerApp, LoadingScreenPlugin } from "webgi";
import { useWebGiStoreViewport } from "webgi/store/webgiViewportStore";
import { processMaterialDatabase, processOutputs } from "webgi/utils/webGiProcessingUtils";
import { addListener, EventResponseMapping, EVENTTYPE_TASK, IEvent, removeListener, TASK_TYPE } from "@shapediver/viewer.session";

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

	const { theme, resolver } = useCustomTheme();

	const { viewportId } = useViewportId();
	const viewport = useWebGiStoreViewport(store => store.viewports[viewportId]);
	const viewportRef = useRef<CoreViewerApp | undefined>(viewport);

	useEffect(() => {
		viewportRef.current = viewport;
		if(!viewport) return;

		const eventListenerTokenTaskStart = addListener(EVENTTYPE_TASK.TASK_START, (e: IEvent) => {
			const event = e as EventResponseMapping[EVENTTYPE_TASK.TASK_START];
			if(event.type === TASK_TYPE.SESSION_CUSTOMIZATION) {
				(viewportRef.current!.getPlugin(LoadingScreenPlugin as any)! as LoadingScreenPlugin).show();
			}
		});
		const eventListenerTokenTaskEnd = addListener(EVENTTYPE_TASK.TASK_END, (e: IEvent) => {
			const event = e as EventResponseMapping[EVENTTYPE_TASK.TASK_END];
			if(event.type === TASK_TYPE.SESSION_CUSTOMIZATION) {
				(viewportRef.current!.getPlugin(LoadingScreenPlugin as any)! as LoadingScreenPlugin).hide();
			}
		});
		const eventListenerTokenTaskCancel = addListener(EVENTTYPE_TASK.TASK_CANCEL, (e: IEvent) => {
			const event = e as EventResponseMapping[EVENTTYPE_TASK.TASK_CANCEL];
			if(event.type === TASK_TYPE.SESSION_CUSTOMIZATION) {
				(viewportRef.current!.getPlugin(LoadingScreenPlugin as any)! as LoadingScreenPlugin).hide();
			}
		});

		Object.values(sessions).forEach(sessionApi => {
			if (sessionApi.updateCallback) sessionApi.updateCallback(sessionApi.node, sessionApi.node);
		});

		return () => {
			removeListener(eventListenerTokenTaskStart);
			removeListener(eventListenerTokenTaskEnd);
			removeListener(eventListenerTokenTaskCancel);
		};
	}, [viewport]);

	const callback = useCallback((newNode?: ShapeDiverViewerSession.ITreeNode) => {
		if (!viewportRef.current || !newNode) return;

		const sessionApiData = newNode.data.find((data) => data instanceof ShapeDiverViewerSession.SessionApiData) as ShapeDiverViewerSession.SessionApiData;
		if (!sessionApiData) return;

		const sessionApi = sessionApiData.api;

		// process the material database
		processMaterialDatabase(sessionApi);

		// disable rendering while loading the model
		if (viewportRef.current) viewportRef.current.renderEnabled = false;

		processOutputs(viewportRef.current, sessionApi);

		// enable rendering again
		if (viewportRef.current) viewportRef.current.renderEnabled = true;
	}, []);

	const sessions = useShapeDiverStoreSession(store => store.sessions);
	const [sessionUpdateCallbackHandlers, setSessionUpdateCallbackHandlers] = useState<JSX.Element[]>([]);


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
		<MantineProvider
			defaultColorScheme="auto"
			forceColorScheme={theme.other?.forceColorScheme}
			theme={theme}
			cssVariablesResolver={resolver}
		>
			{sessionUpdateCallbackHandlers}
			<Notifications />
			<NotificationWrapper>
				<AppBuilderPage />
			</NotificationWrapper>
		</MantineProvider>
	);
}
