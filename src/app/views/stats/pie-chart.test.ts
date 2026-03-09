import { mount, VueWrapper } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import PieChart from "./pie-chart.vue";

describe("PieChart component", () => {
	let pieChart: VueWrapper;

	const data = new Map<string, number>([
		["3", 10],
		["1", 5],
		["2", 5],
	]);

	beforeEach(() => {
		pieChart = mount(PieChart, {
			props: {
				data,
			},
		});
	});

	afterEach(() => {
		pieChart.unmount();
	});

	it("renders a pie figure with one slice and label per entry", () => {
		const figure = pieChart.get('[class*="🥧"]');

		expect(figure.attributes("role")).toBe("figure");

		const slices = pieChart.findAll('[class*="🍕"]');
		const labels = pieChart.findAll('[class*="📝"]');

		expect(slices.length).toBe(data.size);
		expect(labels.length).toBe(data.size);
	});

	it("renders legend rows with correct keys, values, and percentages", () => {
		const total = Array.from(data.values()).reduce(
			(sum, value) => sum + value,
			0,
		);

		const rows = pieChart.findAll("tbody tr");

		expect(rows.length).toBe(data.size);

		const expectedOrder = Array.from(data.entries()).sort((a, b) => {
			const [keyA, valueA] = a;
			const [keyB, valueB] = b;

			if (valueA === valueB) {
				return Number(keyA) - Number(keyB);
			}

			return valueB - valueA;
		});

		rows.forEach((row, index) => {
			const cells = row.findAll("td");
			const [key, value] = expectedOrder[index];

			expect(cells[1].text()).toBe(key);
			expect(cells[2].text()).toBe(String(value));
			expect(cells[3].text()).toBe(((value / total) * 100).toFixed(2));
		});
	});

	it("orders legend rows by descending value and then ascending numeric key", () => {
		const rows = pieChart.findAll("tbody tr");
		const keys = rows.map((row) => row.findAll("td")[1].text());

		expect(keys).toEqual(["3", "1", "2"]);
	});

	it("applies slice styles with percentages matching the data", () => {
		const total = Array.from(data.values()).reduce(
			(sum, value) => sum + value,
			0,
		);

		const rows = pieChart.findAll("tbody tr");

		rows.forEach((row, index) => {
			const span = row.get('[class*="🌈"]');
			const style = span.attributes("style") || "";
			const [, value] = Array.from(data.entries()).sort((a, b) => {
				const [keyA, valueA] = a;
				const [keyB, valueB] = b;

				if (valueA === valueB) {
					return Number(keyA) - Number(keyB);
				}

				return valueB - valueA;
			})[index];

			const fraction = String(value / total);
			const normalizedStyle = style.replace(/\s/g, "");

			expect(normalizedStyle).toContain(`--p:${fraction}`);
		});
	});
});
