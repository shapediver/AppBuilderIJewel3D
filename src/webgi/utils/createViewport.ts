import {
	AssetManagerPlugin,
	CanvasSnipperPlugin,
	CoreViewerApp,
	DiamondPlugin,
	DirectionalLight,
	LoadingScreenPlugin,
	mobileAndTabletCheck,
} from "webgi";
import {ViewportCreateDto} from "webgi/store/webgiViewportStore";

export const createViewport = async (dto: ViewportCreateDto) => {
	const parameters = new URLSearchParams(window.location.search);
	const scene = parameters.get("webgiScene");
	const key = parameters.get("webgiDiamondPlugin");
	LoadingScreenPlugin.LS_DEFAULT_LOGO = "";

	const viewport = new CoreViewerApp({
		canvas: dto.canvas,
	});

	viewport.addPluginSync(CanvasSnipperPlugin as any);

	if (scene) {
		viewport.addPluginSync(AssetManagerPlugin as any);
		await viewport.initialize();
		(
			viewport.getPlugin(
				LoadingScreenPlugin as any,
			)! as LoadingScreenPlugin
		).showFileNames = false;
		(
			viewport.getPlugin(
				LoadingScreenPlugin as any,
			)! as LoadingScreenPlugin
		).filesElement.style.display = "none";
		await viewport.load(scene);
	} else {
		// You can choose from various options when initializing the viewer. Please read more about them here: https://webgi.xyz/docs/api/classes/Viewer_Editor_Templates.CoreViewerApp#initialize
		await viewport.initialize({ground: false});

		(
			viewport.getPlugin(
				LoadingScreenPlugin as any,
			)! as LoadingScreenPlugin
		).showFileNames = false;
		(
			viewport.getPlugin(
				LoadingScreenPlugin as any,
			)! as LoadingScreenPlugin
		).filesElement.style.display = "none";
		viewport.setEnvironmentMap(
			"https://demo-assets.pixotronics.com/pixo/hdr/gem_2.hdr",
		);
		const light = new DirectionalLight(0xffffff, 2.5);
		light.position.set(1, 1, 1);
		viewport.scene.add(light);
	}

	if (key) {
		const diamondPlugin = await viewport.getOrAddPlugin(
			DiamondPlugin as any,
		);
		(diamondPlugin as any).setKey(key);
	}

	// Check if the device is a mobile device
	const isMobile = mobileAndTabletCheck();
	// Set the render scale
	viewport.renderer.renderScale = Math.min(
		isMobile ? 1.5 : 2,
		window.devicePixelRatio,
	);

	return viewport;
};
