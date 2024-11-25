import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { CoreViewerApp } from "webgi";
import { devtoolsSettings } from "shared/store/storeSettings";
import { IEventTracking } from "shared/types/eventTracking";
import { createViewport } from "webgi/utils/createViewport";

// #region Type aliases (1)

/**
 * Callbacks related to IWebGiStore.
 */
export type IWebGiStoreViewportCallbacks = Pick<IEventTracking, "onError">;

// #endregion Type aliases (1)

// #region Interfaces (2)

interface IWebGiStoreViewport {
    // #region Properties (3)

    closeViewport: (viewportId: string, callbacks?: IWebGiStoreViewportCallbacks) => Promise<void>
    createViewport: (dto: ViewportCreateDto, callbacks?: IWebGiStoreViewportCallbacks) => Promise<CoreViewerApp | undefined>,
    viewports: { [id: string]: CoreViewerApp },

    // #endregion Properties (3)
}

export interface ViewportCreateDto {
    // #region Properties (2)

    canvas?: HTMLCanvasElement,
    id?: string,
    branding?: {
        logo?: string | null,
        backgroundColor?: string
    }

    // #endregion Properties (2)
}

// #endregion Interfaces (2)

// #region Variables (2)

/**
 * Store data related to the WebGi 3D Viewer Viewport.
 * @see {@link IWebGiStoreViewport}
 */
export const useWebGiStoreViewport = create<IWebGiStoreViewport>()(devtools((set, get) => ({
	viewports: {},

	createViewport: async (
		dto: ViewportCreateDto,
		callbacks,
	) => {
		// in case a viewport with the same identifier exists, skip creating a new one
		const identifier = dto.id!;
		const { viewports } = get();

		if ( Object.keys(viewports).findIndex(v => identifier === v) >= 0 )
			return;

		let viewport: CoreViewerApp|undefined = undefined;

		try {
			viewport = await createViewport(dto);
		} catch (e: any) {
			callbacks?.onError(e);
		}

		set((state) => {
			return {
				viewports: {
					...state.viewports,
					...viewport ? {[identifier]: viewport} : {},
				},
			};
		}, false, "createViewport");

		return viewport;
	},

	closeViewport: async (
		viewportId,
		callbacks,
	) => {
		const { viewports } = get();
		const viewport = viewports[viewportId];
		if (!viewport) return;

		try {
			await viewport.dispose();
		} catch (e) {
			callbacks?.onError(e);

			return;
		}

		return set((state) => {
			// create a new object, omitting the session which was closed
			const newViewports : {[id: string]: CoreViewerApp} = {};
			Object.keys(state.viewports).forEach(id => {
				if (id !== viewportId)
					newViewports[id] = state.viewports[id];
			});

			return {
				viewports: newViewports,
			};
		}, false, "closeViewport");
	}
}
), { ...devtoolsSettings, name: "WebGi | Viewer" }));

// #endregion Variables (2)
