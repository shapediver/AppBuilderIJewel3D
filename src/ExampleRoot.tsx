import React from "react";
import ReactDOM from "react-dom/client";
import ExampleBase from "ExampleBase";
import reportWebVitals from "reportWebVitals";
import RootComponent from "shared/components/RootComponent";
import { PlausibleTracker } from "instruments/plausible";
import { PARAMETER_TYPE, EXPORT_TYPE } from "@shapediver/viewer.session";
import ExportButtonComponent from "shared/components/shapediver/exports/ExportButtonComponent";
import ParameterBooleanComponent from "shared/components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "shared/components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "shared/components/shapediver/parameter/ParameterFileInputComponent";
import ParameterSelectComponent from "shared/components/shapediver/parameter/ParameterSelectComponent";
import ParameterSliderComponent from "shared/components/shapediver/parameter/ParameterSliderComponent";
import ParameterStringComponent from "shared/components/shapediver/parameter/ParameterStringComponent";
import { IComponentContext } from "shared/types/context/componentcontext";
import ViewportComponent from "webgi/components/ViewportComponent";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const components: IComponentContext = {
	viewportComponent: {component: ViewportComponent},
	parameters: {
		[PARAMETER_TYPE.INT]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.FLOAT]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.EVEN]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.ODD]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.BOOL]: {component: ParameterBooleanComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.STRING]: {component: ParameterStringComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.STRINGLIST]: {component: ParameterSelectComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.COLOR]: {component: ParameterColorComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.FILE]: {component: ParameterFileInputComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.DRAWING]: {component: ParameterStringComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.INTERACTION]: {            
			"selection": {component: ParameterStringComponent, extraBottomPadding: false},
			"gumball": {component: ParameterStringComponent, extraBottomPadding: false},
			"dragging": {component: ParameterStringComponent, extraBottomPadding: false},
		}
	},
	exports: {
		[EXPORT_TYPE.DOWNLOAD]: {component: ExportButtonComponent},
		[EXPORT_TYPE.EMAIL]: {component: ExportButtonComponent},
	}
};

root.render(
	<RootComponent 
		useStrictMode={false}
		tracker={PlausibleTracker}
		componentContext={components}
	>
		<ExampleBase/>
	</RootComponent>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(r => console.debug("reportWebVitals", r));
