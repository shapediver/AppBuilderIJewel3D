import type {IAppBuilderParameterValueSourcePropsScreenshot} from "@AppBuilderShared/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderShared/shared/lib/logger";
import {CAMERA_TYPE} from "@shapediver/viewer.shared.types";
import {CanvasSnipperPlugin, CoreViewerApp} from "webgi";

const DEFAULT_CONTENT_TYPE = "image/png";
const DEFAULT_QUALITY = 1;
const MAX_RESOLUTION = 8192;
const OVERLAY_ATTRIBUTE = "data-webgi-screenshot-overlay";

const screenshotQueues = new WeakMap<CoreViewerApp, Promise<unknown>>();

/**
 * Capture a viewport screenshot, honoring App Builder screenshot props.
 *
 * `contentType`, `quality`, `resolution`, and `camera` come from the caller.
 * Shared defaults apply when a field is omitted (PNG, quality 1, current
 * canvas size). Resolution always resizes the renderer and waits one frame
 * so the aspect ratio is correct; there is no 2D blit.
 */
export async function getViewportScreenshot(
	viewport: CoreViewerApp,
	props?: IAppBuilderParameterValueSourcePropsScreenshot,
): Promise<string> {
	const previous = screenshotQueues.get(viewport) ?? Promise.resolve();
	const run = previous.then(
		() => captureViewportScreenshot(viewport, props),
		() => captureViewportScreenshot(viewport, props),
	);
	screenshotQueues.set(
		viewport,
		run.then(
			() => undefined,
			() => undefined,
		),
	);
	return run;
}

async function captureViewportScreenshot(
	viewport: CoreViewerApp,
	props?: IAppBuilderParameterValueSourcePropsScreenshot,
): Promise<string> {
	const started = performance.now();
	const contentType = props?.contentType ?? DEFAULT_CONTENT_TYPE;
	const quality = props?.quality ?? DEFAULT_QUALITY;
	const resolution = clampResolution(props?.resolution);
	const cameraProps = props?.camera;
	const mutatesViewport = !!resolution || !!cameraProps;

	const overlay = mutatesViewport ? freezeViewport(viewport) : undefined;
	const originalRenderScale = viewport.renderer.renderScale;
	const cameraController = viewport.scene.activeCamera;
	const originalCamera = cameraController
		? {
				position: cameraController.position.clone(),
				target: cameraController.target.clone(),
				options: {...cameraController.getCameraOptions()},
			}
		: undefined;

	try {
		if (resolution) {
			viewport.renderer.renderScale = 1;
			viewport.setSize({
				width: resolution.width,
				height: resolution.height,
			});
			viewport.renderer.setSize(
				resolution.width,
				resolution.height,
				true,
			);
			viewport.resize();
			viewport.setDirty();
		}

		if (cameraProps && cameraController) {
			applyScreenshotCamera(cameraController, cameraProps);
			viewport.setDirty();
		}

		if (mutatesViewport) {
			await viewport.doOnce("postFrame");
		}

		const dataUrl = await captureDataUrl(viewport, contentType, quality);

		const timing = {
			totalMs: Math.round(performance.now() - started),
			contentType,
			quality,
			width: viewport.canvas.width,
			height: viewport.canvas.height,
			bytes: Math.round((dataUrl.length * 3) / 4),
		};
		console.info("[webgi screenshot]", timing);
		(
			window as Window & {
				__webgiScreenshotTiming?: typeof timing;
			}
		).__webgiScreenshotTiming = timing;

		return dataUrl;
	} finally {
		if (resolution) {
			viewport.renderer.renderScale = originalRenderScale;
			viewport.setSize();
			viewport.resize();
			viewport.setDirty();
		}

		if (originalCamera && cameraController && cameraProps) {
			cameraController.setCameraOptions(originalCamera.options);
			cameraController.position.copy(originalCamera.position);
			cameraController.target.copy(originalCamera.target);
			cameraController.positionUpdated();
			cameraController.targetUpdated();
			viewport.setDirty();
		}

		overlay?.restore();
	}
}

function applyScreenshotCamera(
	cameraController: CoreViewerApp["scene"]["activeCamera"],
	camera: NonNullable<
		IAppBuilderParameterValueSourcePropsScreenshot["camera"]
	>,
): void {
	if (typeof camera.name === "string") {
		Logger.warn(
			`Screenshot camera name "${camera.name}" is not supported in the iJewel viewport; using the current camera.`,
		);
	}

	if (camera.type === CAMERA_TYPE.ORTHOGRAPHIC) {
		cameraController.setCameraOptions({type: "OrthographicCamera"});
	} else if (camera.type === CAMERA_TYPE.PERSPECTIVE) {
		const fov =
			"fov" in camera && typeof camera.fov === "number"
				? {fov: camera.fov}
				: {};
		cameraController.setCameraOptions({
			type: "PerspectiveCamera",
			...fov,
		});
	} else if ("fov" in camera && typeof camera.fov === "number") {
		cameraController.setCameraOptions({fov: camera.fov});
	}

	const position = toVec3(camera.position);
	if (position) {
		cameraController.position.set(position[0], position[1], position[2]);
		cameraController.positionUpdated();
	}

	const target = toVec3(camera.target);
	if (target) {
		cameraController.target.set(target[0], target[1], target[2]);
		cameraController.targetUpdated();
	}
}

async function captureDataUrl(
	viewport: CoreViewerApp,
	contentType: string,
	quality: number,
): Promise<string> {
	const snipper = viewport.getPlugin(CanvasSnipperPlugin as any) as
		| CanvasSnipperPlugin
		| undefined;
	if (!snipper) {
		return viewport.canvas.toDataURL(contentType, quality);
	}

	return snipper.getDataUrl({
		mimeType: contentType,
		quality,
		waitForProgressive: false,
	} as any);
}

function freezeViewport(viewport: CoreViewerApp): {restore: () => void} {
	const canvas = viewport.canvas;
	const parent = canvas.parentElement;
	if (!parent) {
		return {restore: () => undefined};
	}

	const img = document.createElement("img");
	img.src = canvas.toDataURL("image/jpeg", 0.5);
	img.setAttribute(OVERLAY_ATTRIBUTE, "true");
	img.style.position = "absolute";
	img.style.top = "0";
	img.style.left = "0";
	img.style.width = "100%";
	img.style.height = "100%";
	img.style.pointerEvents = "none";
	parent.appendChild(img);
	const previousVisibility = canvas.style.visibility;
	canvas.style.visibility = "hidden";

	return {
		restore: () => {
			canvas.style.visibility = previousVisibility;
			img.remove();
		},
	};
}

function clampResolution(resolution?: {
	width: number;
	height: number;
}): {width: number; height: number} | undefined {
	if (!resolution) return undefined;
	const width = Math.floor(resolution.width);
	const height = Math.floor(resolution.height);
	if (width < 1 || height < 1) return undefined;
	return {
		width: Math.min(width, MAX_RESOLUTION),
		height: Math.min(height, MAX_RESOLUTION),
	};
}

function toVec3(value: unknown): [number, number, number] | undefined {
	if (!value || typeof value !== "object") return undefined;
	const vector = value as ArrayLike<number>;
	if (
		typeof vector.length === "number" &&
		vector.length >= 3 &&
		typeof vector[0] === "number" &&
		typeof vector[1] === "number" &&
		typeof vector[2] === "number"
	) {
		return [vector[0], vector[1], vector[2]];
	}
	return undefined;
}
