import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import { MantineProvider } from "@mantine/core";
import React, { useEffect } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import NoMatchPage from "shared/pages/misc/NoMatchPage";
import * as ShapeDiverViewerSession from "@shapediver/viewer.session";
import { useCustomTheme } from "shared/hooks/ui/useCustomTheme";
import { Notifications } from "@mantine/notifications";
import NotificationWrapper from "shared/components/ui/NotificationWrapper";
import WebGiExamplePage from "pages/WebGiExamplePage";

declare global {
	interface Window {
		SDV: typeof ShapeDiverViewerSession;
	}
}

export default function ExampleBase() {

	useEffect(() => {
		window.SDV = ShapeDiverViewerSession;
	}, []);

	const { theme, resolver } = useCustomTheme();

	return (
		<MantineProvider defaultColorScheme="auto" theme={theme} cssVariablesResolver={resolver}>
			<Notifications />
			<NotificationWrapper>
				<HashRouter>
					<Routes>
						<Route path="/" element={<WebGiExamplePage example="Ring" />} />
						<Route path="*" element={<NoMatchPage />} />
					</Routes>
				</HashRouter>
			</NotificationWrapper>
		</MantineProvider>
	);
}
