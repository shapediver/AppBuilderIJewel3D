import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {useViewportId} from "@AppBuilderShared/entities/viewport/model/useViewportId";
import {useEffect, useRef, useState} from "react";
import {AssetExporterPlugin, CanvasSnipperPlugin} from "webgi";
import {useShallow} from "zustand/react/shallow";
import {
	useWebGiStoreViewport,
	ViewportCreateDto,
} from "../store/webgiViewportStore";

/**
 * Hook for creating a viewport of the ShapeDiver 3D Viewer.
 * Typically, you want to directly use the {@link ViewportComponent} instead
 * of calling this hook yourself.
 * @param props
 * @returns
 */
export function useViewport(props: ViewportCreateDto) {
	const {createViewport, closeViewport} = useWebGiStoreViewport(
		useShallow((state) => ({
			createViewport: state.createViewport,
			closeViewport: state.closeViewport,
		})),
	);
	const {addViewportAccessFunctions, removeViewportAccessFunctions} =
		useShapeDiverStoreViewportAccessFunctions();
	const [error, setError] = useState<Error | undefined>(undefined);
	const promiseChain = useRef(Promise.resolve());
	const canvasRef = useRef(null);
	const {viewportId: defaultViewportId} = useViewportId();
	const _props = {...props, id: props.id ?? defaultViewportId};

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const viewport = await createViewport(
				{
					canvas: canvasRef.current!,
					..._props,
				},
				{onError: setError},
			);

			if (viewport)
				addViewportAccessFunctions(_props.id, {
					dto: _props,
					getScreenshot: async () => {
						const snapshot = await (
							viewport.getPlugin(
								CanvasSnipperPlugin as any,
							)! as CanvasSnipperPlugin
						).getDataUrl({
							mimeType: "image/png",
							displayPixelRatio: 2, // quality
							waitForProgressive: true,
						} as any);

						return snapshot;
					},
					convertToGlTF: async () => {
						const exporter = viewport.getPlugin(
							AssetExporterPlugin as any,
						)! as AssetExporterPlugin;
						return (await exporter.exportScene({
							...exporter.exportOptions,
							viewerConfig: true, // export with vjson embedded
							compress: false, // disable draco compression
						})) as Blob;
					},
				});
		});

		return () => {
			promiseChain.current = promiseChain.current
				.then(() => closeViewport(_props.id))
				.then(() => removeViewportAccessFunctions(_props.id));
		};
	}, [props.id]);

	return {
		canvasRef,
		error,
	};
}
