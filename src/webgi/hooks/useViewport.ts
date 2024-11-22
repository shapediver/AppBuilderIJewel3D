import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWebGiStoreViewport, ViewportCreateDto } from "../store/webgiViewportStore";
import { useViewportId } from "shared/hooks/shapediver/viewer/useViewportId";

/**
 * Hook for creating a viewport of the ShapeDiver 3D Viewer.
 * Typically, you want to directly use the {@link ViewportComponent} instead
 * of calling this hook yourself.
 * @see {@link useShapeDiverStoreViewport} to access the API of the viewport.
 * @param props
 * @returns
 */
export function useViewport(props: ViewportCreateDto) {
	const { createViewport, closeViewport } = useWebGiStoreViewport(
		useShallow(state => ({ createViewport: state.createViewport, closeViewport: state.closeViewport }))
	);
	const [error, setError] = useState<Error | undefined>(undefined);
	const promiseChain = useRef(Promise.resolve());
	const canvasRef = useRef(null);
	const { viewportId: defaultViewportId } = useViewportId();
	const _props = { ...props, id: props.id ?? defaultViewportId };

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			await createViewport({
				canvas: canvasRef.current!,
				..._props
			}, { onError: setError });
		});

		return () => {
			promiseChain.current = promiseChain.current
				.then(() => closeViewport(_props.id));
		};
	}, [props.id]);

	return {
		canvasRef,
		error
	};
}
