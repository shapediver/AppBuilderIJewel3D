import NotificationWrapper from "@AppBuilderShared/components/ui/NotificationWrapper";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useCustomTheme} from "@AppBuilderShared/hooks/ui/useCustomTheme";
import AppBuilderPage from "@AppBuilderShared/pages/appbuilder/AppBuilderPage";
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
	removeListener,
	TASK_TYPE,
} from "@shapediver/viewer.session";
import {useWebGiStoreViewport} from "@webgi/store/webgiViewportStore";
import {
	processMaterialDatabase,
	processOutputs,
} from "@webgi/utils/webGiProcessingUtils";
import React, {useCallback, useEffect, useRef} from "react";
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

	const callback = useCallback(
		(newNode?: ShapeDiverViewerSession.ITreeNode) => {
			if (!viewportRef.current || !newNode) return;

			const sessionApiData = newNode.data.find(
				(data) =>
					data instanceof ShapeDiverViewerSession.SessionApiData,
			) as ShapeDiverViewerSession.SessionApiData;
			if (!sessionApiData) return;

			const sessionApi = sessionApiData.api;

			// process the material database
			processMaterialDatabase(sessionApi);

			// disable rendering while loading the model
			if (viewportRef.current) viewportRef.current.renderEnabled = false;

			processOutputs(viewportRef.current, sessionApi);

			// enable rendering again
			if (viewportRef.current) viewportRef.current.renderEnabled = true;
		},
		[],
	);

	useEffect(() => {
		viewportRef.current = viewport;
		if (!viewport) return;

		const eventListenerTokenTaskStart = addListener(
			EVENTTYPE_TASK.TASK_START,
			(e: IEvent) => {
				const event =
					e as EventResponseMapping[EVENTTYPE_TASK.TASK_START];
				if (event.type === TASK_TYPE.SESSION_CUSTOMIZATION) {
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
				if (event.type === TASK_TYPE.SESSION_CUSTOMIZATION) {
					(
						viewportRef.current!.getPlugin(
							LoadingScreenPlugin as any,
						)! as LoadingScreenPlugin
					).hide();

					Object.values(sessions).forEach((sessionApi) => {
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
				if (event.type === TASK_TYPE.SESSION_CUSTOMIZATION) {
					(
						viewportRef.current!.getPlugin(
							LoadingScreenPlugin as any,
						)! as LoadingScreenPlugin
					).hide();
				}
			},
		);

		Object.values(sessions).forEach((sessionApi) => {
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
