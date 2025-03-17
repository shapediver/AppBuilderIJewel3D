import RootComponent from "@AppBuilderShared/components/RootComponent";
import ExportButtonComponent from "@AppBuilderShared/components/shapediver/exports/ExportButtonComponent";
import ParameterBooleanComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterFileInputComponent";
import ParameterSelectComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectComponent";
import ParameterSliderComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSliderComponent";
import ParameterStringComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterStringComponent";
import {IComponentContext} from "@AppBuilderShared/types/context/componentcontext";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import AppBuilderBase from "AppBuilderBase";
import {PlausibleTracker} from "instruments/plausible";
import "instruments/sentry";
import {setupWebVitalsTracking} from "instruments/webvitals";
import React from "react";
import ReactDOM from "react-dom/client";
import ViewportComponent from "webgi/components/ViewportComponent";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const components: IComponentContext = {
	viewportComponent: {component: ViewportComponent},
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
		},
	},
	exports: {
		[EXPORT_TYPE.DOWNLOAD]: {component: ExportButtonComponent},
		[EXPORT_TYPE.EMAIL]: {component: ExportButtonComponent},
	},
};

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
		componentContext={components}
	>
		<AppBuilderBase />
	</RootComponent>,
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
