import React, { useEffect } from "react";
import { MantineThemeComponent, useComputedColorScheme, useProps } from "@mantine/core";
import { ViewportCreateDto } from "../store/webgiViewportStore";
import { useViewport } from "../hooks/useViewport";
import AlertPage from "shared/pages/misc/AlertPage";
import classes from "./ViewportComponent.module.css";


interface Props extends ViewportCreateDto {
	children?: React.ReactNode;
	className?: string;
}

interface ViewportBranding {
	/** 
	 * Optional URL to a logo to be displayed while the viewport is hidden. 
	 * A default logo will be used if none is provided. 
	 * Supply null to display no logo at all.
	 */
	logo?: string | null,
	/** 
	 * Optional background color to show while the viewport is hidden, can include alpha channel. 
	 * A default color will be used if none is provided.
	 */
	backgroundColor?: string
}

interface ViewportBrandingProps {
	/** Branding settings for dark scheme */
	dark: ViewportBranding;
	/** Branding settings for light scheme */
	light: ViewportBranding;
}

type ViewportComponentThemePropsType = Partial<Omit<ViewportCreateDto, "canvas" | "id">>;

export function ViewportComponentThemeProps(props: ViewportComponentThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

type ViewportBrandingThemePropsType = Partial<ViewportBrandingProps>;

export function ViewportBrandingThemeProps(props: ViewportBrandingThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: Props) {
	const { children = <></>, className = "", ...rest } = props;
	const _props = useProps("ViewportComponent", {}, rest);

	const brandingProps = useProps("ViewportBranding", {}, {}) as ViewportBrandingProps;
	const scheme = useComputedColorScheme();
	if (!_props.branding) 
		_props.branding = brandingProps[scheme];

	const { viewport, canvasRef, error } = useViewport(_props);

	useEffect(() => {
		// Ensure the element is available
		if (!canvasRef.current || !viewport) return;

		const handleResize = (entries: ResizeObserverEntry[]) => {
			for (const entry of entries) {
				if (entry.target === canvasRef.current) {
					// The canvas has been resized
					// You can do any additional logic here
					console.debug("Canvas resized:", entry.contentRect);
					viewport.fitToView();
				}
			}
		};

		// Create a new ResizeObserver instance
		const observer = new ResizeObserver(handleResize);
		observer.observe(canvasRef.current);

		// Clean up when the component unmounts or ref changes
		return () => {
			observer.disconnect();
		};
	}, [viewport, canvasRef]);
	

	return (
		error ? <AlertPage title="Error">{error.message}</AlertPage> :
			<div className={`${classes.container} ${className}`}>
				<canvas className={`${classes.canvas}`} ref={canvasRef} />
				{children}
			</div>
	);
}
