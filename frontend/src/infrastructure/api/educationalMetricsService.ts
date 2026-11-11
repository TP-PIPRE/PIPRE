import axiosInstance from "./axiosInstance";

import type { MetricsFilter, MetricsOptions, MetricsReport } from "./models/educationalMetricsModels";

export const educationalMetricsService = {
  options: async () => (await axiosInstance.get<MetricsOptions>("educational-metrics/options")).data,
  report: async (filter: MetricsFilter) => (await axiosInstance.get<MetricsReport>("educational-metrics", { params: filter })).data,
};
