import ExportButtonComponent from "@AppBuilderLib/entities/export/ui/ExportButtonComponent";
import ParameterBooleanComponent from "@AppBuilderLib/entities/parameter/ui/ParameterBooleanComponent";
import ParameterColorComponent from "@AppBuilderLib/entities/parameter/ui/ParameterColorComponent";
import ParameterFileInputComponent from "@AppBuilderLib/entities/parameter/ui/ParameterFileInputComponent";
import ParameterSelectComponent from "@AppBuilderLib/entities/parameter/ui/ParameterSelectComponent";
import ParameterSliderComponent from "@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent";
import ParameterStringComponent from "@AppBuilderLib/entities/parameter/ui/ParameterStringComponent";
import ViewportOverlayWrapper from "@AppBuilderLib/entities/viewport/ui/ViewportOverlayWrapper";
import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import RootComponent from "@AppBuilderLib/shared/ui/root/RootComponent";
import AppBuilderContainerComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderFallbackContainerComponent";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import ViewportComponent from "webgi/components/ViewportComponent";
import AppBuilderBase from "~/AppBuilderBase";
import {PlausibleTracker} from "~/instruments/plausible";
import {setupWebVitalsTracking} from "~/instruments/webvitals";
import {SentryErrorReportingContext} from "./instruments/sentry";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const components: IComponentContext = {
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
				component: ParameterStringComponent,
				extraBottomPadding: false,
			},
		},
	},
	exports: {
		[EXPORT_TYPE.DOWNLOAD]: {component: ExportButtonComponent},
		[EXPORT_TYPE.EMAIL]: {component: ExportButtonComponent},
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
