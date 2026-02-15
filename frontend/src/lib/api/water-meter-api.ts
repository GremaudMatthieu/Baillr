import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface MeterReadingData {
  unitId: string;
  previousReading: number;
  currentReading: number;
  readingDate: string;
}

export interface WaterMeterReadingsData {
  id: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  readings: MeterReadingData[];
  totalConsumption: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordWaterMeterReadingsPayload {
  id: string;
  fiscalYear: number;
  readings: MeterReadingData[];
}

export interface WaterDistributionData {
  totalWaterCents: number;
  totalConsumption: number;
  distributions: Array<{
    unitId: string;
    consumption: number | null;
    percentage: number | null;
    isMetered: boolean;
    amountCents: number;
  }>;
}

export function useWaterMeterApi() {
  const { getToken } = useAuth();

  return {
    async getWaterMeterReadings(
      entityId: string,
      fiscalYear: number,
    ): Promise<WaterMeterReadingsData | null> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/water-meter-readings?fiscalYear=${fiscalYear}`,
        getToken,
      );
      const body = (await res.json()) as { data: WaterMeterReadingsData | null };
      return body.data;
    },

    async recordWaterMeterReadings(
      entityId: string,
      payload: RecordWaterMeterReadingsPayload,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/water-meter-readings`,
        getToken,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },

    async getWaterDistribution(
      entityId: string,
      fiscalYear: number,
    ): Promise<WaterDistributionData | null> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/water-distribution?fiscalYear=${fiscalYear}`,
        getToken,
      );
      const body = (await res.json()) as { data: WaterDistributionData | null };
      return body.data;
    },
  };
}
