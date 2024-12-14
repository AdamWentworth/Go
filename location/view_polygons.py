import os
import json
import matplotlib.pyplot as plt
from shapely.geometry import LineString, Polygon, MultiPolygon
from shapely.ops import unary_union, polygonize
from matplotlib.patches import Polygon as MplPolygon

class PolygonVisualizer:
    def __init__(self, polygons_folder):
        """
        Initialize the visualizer with the folder containing GeoJSON polygon files.
        
        :param polygons_folder: Path to the folder with GeoJSON files.
        """
        self.polygons_folder = polygons_folder
        self.polygon_files = sorted(
            [
                os.path.join(polygons_folder, f)
                for f in os.listdir(polygons_folder)
                if f.endswith('.geojson')
            ],
            key=lambda x: int(os.path.splitext(os.path.basename(x))[0].split('_')[1])
        )
        self.current_index = 0
        self.parts = []  # To store LineString parts
        self.composite_polygon = None  # To store the merged polygon parts
        self.composite_patches = []  # To keep track of composite polygon patches

        if not self.polygon_files:
            raise ValueError(f"No GeoJSON files found in '{polygons_folder}'.")

        # Precompute all coordinates to set plot limits
        self._compute_plot_limits()

        # Set up the plot
        self.fig, self.ax = plt.subplots()
        self.ax.set_title("Composite Polygon Visualizer\nClick to add the next polygon part")
        self.ax.set_xlabel("Longitude")
        self.ax.set_ylabel("Latitude")
        self.ax.set_aspect('equal')

        # Set fixed plot limits
        self._initialize_plot()

        # Connect the click event
        self.cid_click = self.fig.canvas.mpl_connect('button_press_event', self.on_click)
        self.cid_right_click = self.fig.canvas.mpl_connect('button_press_event', self.on_right_click)

        # Initial display
        plt.show()

    def _compute_plot_limits(self):
        """
        Compute the overall min and max coordinates to set plot limits.
        """
        min_lon, min_lat = float('inf'), float('inf')
        max_lon, max_lat = float('-inf'), float('-inf')

        for polygon_file in self.polygon_files:
            try:
                with open(polygon_file, 'r', encoding='utf-8') as f:
                    geojson = json.load(f)
                coords = geojson['geometry']['coordinates'][0]
                lons, lats = zip(*coords)
                min_lon = min(min_lon, min(lons))
                min_lat = min(min_lat, min(lats))
                max_lon = max(max_lon, max(lons))
                max_lat = max(max_lat, max(lats))
            except (KeyError, IndexError, ValueError) as e:
                print(f"Skipping file '{polygon_file}' due to error: {e}")

        # Add some padding
        padding_lon = (max_lon - min_lon) * 0.05 if max_lon != min_lon else 1
        padding_lat = (max_lat - min_lat) * 0.05 if max_lat != min_lat else 1

        self.plot_limits = (
            min_lon - padding_lon,
            max_lon + padding_lon,
            min_lat - padding_lat,
            max_lat + padding_lat
        )

    def _initialize_plot(self):
        """
        Set initial plot limits.
        """
        self.ax.set_xlim(self.plot_limits[0], self.plot_limits[1])
        self.ax.set_ylim(self.plot_limits[2], self.plot_limits[3])
        # Removed: self.ax.set_autoscale(False)  # Disable autoscaling to maintain fixed view

    def on_click(self, event):
        """
        Event handler for left mouse clicks. Adds the next polygon part on each click.
        
        :param event: Matplotlib event.
        """
        if event.button != 1:  # Only respond to left-click
            return

        if self.current_index >= len(self.polygon_files):
            print("All polygon parts have been added.")
            return

        polygon_file = self.polygon_files[self.current_index]
        print(f"Adding polygon part from: {polygon_file}")

        try:
            with open(polygon_file, 'r', encoding='utf-8') as f:
                geojson = json.load(f)
            
            # Extract coordinates
            coordinates = geojson['geometry']['coordinates'][0]
            if not coordinates:
                print(f"No coordinates found in '{polygon_file}'. Skipping.")
                self.current_index += 1
                return

            # Create Shapely LineString
            part_line = LineString(coordinates)
            if not part_line.is_valid:
                print(f"Invalid LineString in '{polygon_file}'. Attempting to fix.")
                part_line = part_line.buffer(0)
                if not part_line.is_valid:
                    print(f"Could not fix LineString in '{polygon_file}'. Skipping.")
                    self.current_index += 1
                    return

            # Add the part to the list
            self.parts.append(part_line)

            # Perform polygonization
            merged = unary_union(self.parts)
            polygons = list(polygonize(merged))  # List of Polygon objects

            if not polygons:
                print(f"Current parts do not form a complete polygon yet.")
                self.composite_polygon = None
            else:
                # Merge all polygons into a single MultiPolygon or Polygon
                self.composite_polygon = unary_union(polygons)

            # Plot the new part as a LineString
            x, y = part_line.xy
            self.ax.plot(x, y, color='gray', linestyle='--', linewidth=1)
            # Optionally, add labels to parts
            self.ax.text(x[0], y[0], f"P{self.current_index + 1}", fontsize=8, color='blue')

            # Update the composite polygon
            # First, remove existing composite polygon patches
            for patch in self.composite_patches:
                patch.remove()
            self.composite_patches = []

            if isinstance(self.composite_polygon, Polygon):
                polygons_to_draw = [self.composite_polygon]
            elif isinstance(self.composite_polygon, MultiPolygon):
                polygons_to_draw = list(self.composite_polygon.geoms)
            else:
                polygons_to_draw = []

            for poly in polygons_to_draw:
                exterior_coords = list(poly.exterior.coords)
                mpl_poly = MplPolygon(exterior_coords, closed=True, edgecolor='green', fill=False, linewidth=2)
                self.ax.add_patch(mpl_poly)
                self.composite_patches.append(mpl_poly)

                # Optionally, add labels or other annotations
                centroid = poly.centroid
                self.ax.text(
                    centroid.x, centroid.y,
                    "Composite",
                    fontsize=9, color='red'
                )

            # Update the plot without changing the view
            self.fig.canvas.draw_idle()

            self.current_index += 1

        except (KeyError, IndexError, ValueError, json.JSONDecodeError) as e:
            print(f"Error processing file '{polygon_file}': {e}")
            self.current_index += 1

    def on_right_click(self, event):
        """
        Event handler for right mouse clicks. Zooms out the plot.
        
        :param event: Matplotlib event.
        """
        if event.button != 3:  # Only respond to right-click
            return

        # Define a zoom factor
        zoom_factor = 1.2

        # Get current limits
        x_min, x_max = self.ax.get_xlim()
        y_min, y_max = self.ax.get_ylim()

        # Calculate new limits
        x_range = (x_max - x_min) * zoom_factor
        y_range = (y_max - y_min) * zoom_factor

        # Calculate centers
        x_center = (x_max + x_min) / 2
        y_center = (y_max + y_min) / 2

        # Set new limits
        self.ax.set_xlim(x_center - x_range / 2, x_center + x_range / 2)
        self.ax.set_ylim(y_center - y_range / 2, y_center + y_range / 2)

        # Redraw the plot
        self.fig.canvas.draw_idle()

    def run(self):
        """
        Run the visualizer. The plot is already displayed in __init__.
        """
        plt.show()

if __name__ == "__main__":
    # Replace with your output folder path
    output_folder = "output_polygons"
    
    if not os.path.exists(output_folder):
        print(f"Output folder '{output_folder}' does not exist.")
    else:
        try:
            visualizer = PolygonVisualizer(output_folder)
        except ValueError as e:
            print(e)
