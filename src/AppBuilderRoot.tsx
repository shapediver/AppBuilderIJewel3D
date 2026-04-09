import ExportButtonComponent from "@AppBuilderShared/components/shapediver/exports/ExportButtonComponent";
import ParameterBooleanComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterFileInputComponent";
import ParameterSelectComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectComponent";
import ParameterSliderComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSliderComponent";
import ParameterStringComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterStringComponent";
import ViewportAnchor2d, {
	ViewportAnchor2dThemeProps,
} from "@AppBuilderLib/entities/viewport-anchor/ui/ViewportAnchor2d";
import ViewportAnchor3d, {
	ViewportAnchor3dThemeProps,
} from "@AppBuilderLib/entities/viewport-anchor/ui/ViewportAnchor3d";
import ViewportComponent from "@AppBuilderLib/entities/viewport/ui/ViewportComponent";
import ViewportOverlayWrapper from "@AppBuilderLib/entities/viewport/ui/ViewportOverlayWrapper";
import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {
	AppBuilderContainerNameType,
	isCameraAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import AppBuilderActionCameraComponent from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionCameraComponent";
import RootComponent from "@AppBuilderLib/shared/ui/root/RootComponent";
import AppBuilderContainerComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderFallbackContainerComponent";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "~/AppBuilderBase";
import {PlausibleTracker} from "~/instruments/plausible";
import {setupWebVitalsTracking} from "~/instruments/webvitals";
import {SentryErrorReportingContext} from "./instruments/sentry";
import {
	ParameterRectangleTransformComponent,
} from "./shared/entities/parameter/ui";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const components: IComponentContext = {
	viewportAnchors: {
		[AppBuilderContainerNameType.Anchor2d]: {
			component: ViewportAnchor2d,
			themeProps: ViewportAnchor2dThemeProps,
		},
		[AppBuilderContainerNameType.Anchor3d]: {
			component: ViewportAnchor3d,
			themeProps: ViewportAnchor3dThemeProps,
		},
	},
	viewportComponent: {component: ViewportComponent},
	viewportOverlayWrapper: {component: ViewportOverlayWrapper},
	parameters: {
		[PARAMETER_TYPE.INT]: {
			component: ParameterSliderComponent,
			extraBottomPadding: true,
		},
		[PARAMETER_TYPE.FLOAT]: {
			component: ParameterSliderComponent,
			extraBottomPadding: true,
		},
		[PARAMETER_TYPE.EVEN]: {
			component: ParameterSliderComponent,
			extraBottomPadding: true,
		},
		[PARAMETER_TYPE.ODD]: {
			component: ParameterSliderComponent,
			extraBottomPadding: true,
		},
		[PARAMETER_TYPE.BOOL]: {
			component: ParameterBooleanComponent,
			extraBottomPadding: false,
		},
		[PARAMETER_TYPE.STRING]: {
			component: ParameterStringComponent,
			extraBottomPadding: false,
		},
		[PARAMETER_TYPE.STRINGLIST]: {
			component: ParameterSelectComponent,
			extraBottomPadding: false,
		},
		[PARAMETER_TYPE.COLOR]: {
			component: ParameterColorComponent,
			extraBottomPadding: false,
		},
		[PARAMETER_TYPE.FILE]: {
			component: ParameterFileInputComponent,
			extraBottomPadding: false,
		},
		[PARAMETER_TYPE.DRAWING]: {
			component: ParameterStringComponent,
			extraBottomPadding: true,
		},
		[PARAMETER_TYPE.INTERACTION]: {
			selection: {
				component: ParameterStringComponent,
				extraBottomPadding: false,
			},
			gumball: {
				component: ParameterStringComponent,
				extraBottomPadding: false,
			},
			dragging: {
				component: ParameterStringComponent,
				extraBottomPadding: false,
			},
			rectangleTransform: {
				component: ParameterRectangleTransformComponent,
				extraBottomPadding: false,
			},
		},
	},
	exports: {
		[EXPORT_TYPE.DOWNLOAD]: {component: ExportButtonComponent},
		[EXPORT_TYPE.EMAIL]: {component: ExportButtonComponent},
	},
	actions: {
		camera: {
			isAction: isCameraAction,
			component: AppBuilderActionCameraComponent,
		},
	},
	containerComponent: AppBuilderContainerComponent,
	fallbackContainerComponent: AppBuilderFallbackContainerComponent,
};

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
		errorReporting={SentryErrorReportingContext}
		componentContext={components}
	>
		<AppBuilderBase />
	</RootComponent>,
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
