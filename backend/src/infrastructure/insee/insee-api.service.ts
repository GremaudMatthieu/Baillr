import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { InseeApiUnavailableException } from './insee-api-unavailable.exception.js';

export interface InseeIndexResult {
  type: string;
  quarter: string;
  year: number;
  value: number;
  publishedAt: string;
}

const SERIES_IDS: Record<string, string> = {
  '001515333': 'IRL',
  '001532540': 'ILC',
  '000008630': 'ICC',
};

const BDM_URL =
  'https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/001515333+001532540+000008630?lastNObservations=4';

@Injectable()
export class InseeApiService {
  private readonly logger = new Logger(InseeApiService.name);

  async fetchLatestIndices(): Promise<InseeIndexResult[]> {
    let response: Response;
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 15_000);
    try {
      response = await fetch(BDM_URL, {
        headers: { Accept: 'application/xml' },
        signal: abortController.signal,
      });
    } catch (error) {
      this.logger.error(
        `INSEE BDM API network error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw InseeApiUnavailableException.networkError();
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      this.logger.error(
        `INSEE BDM API returned status ${response.status}`,
      );
      throw InseeApiUnavailableException.httpError(response.status);
    }

    const xml = await response.text();
    return this.parseXml(xml);
  }

  private parseXml(xml: string): InseeIndexResult[] {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });

    let parsed: unknown;
    try {
      parsed = parser.parse(xml);
    } catch (error) {
      this.logger.error(
        `INSEE BDM XML parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw InseeApiUnavailableException.parseError();
    }

    try {
      return this.extractIndices(parsed);
    } catch (error) {
      if (error instanceof InseeApiUnavailableException) {
        throw error;
      }
      this.logger.error(
        `INSEE BDM unexpected XML structure: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw InseeApiUnavailableException.parseError();
    }
  }

  private extractIndices(parsed: unknown): InseeIndexResult[] {
    const results: InseeIndexResult[] = [];

    // Navigate SDMX structure: supports both v2.0 (MessageGroup) and v2.1 (StructureSpecificData)
    const root = ((parsed as Record<string, unknown>)?.[
      'message:StructureSpecificData'
    ] ??
      (parsed as Record<string, unknown>)?.[
        'message:MessageGroup'
      ]) as Record<string, unknown> | undefined;

    if (!root) {
      throw InseeApiUnavailableException.parseError();
    }

    const dataSet = (root['message:DataSet'] ??
      root['DataSet']) as Record<string, unknown> | undefined;

    if (!dataSet) {
      throw InseeApiUnavailableException.parseError();
    }

    const seriesArray = this.ensureArray(
      (dataSet['Series'] ?? dataSet['series:Series']) as unknown,
    );

    for (const series of seriesArray) {
      const seriesObj = series as Record<string, unknown>;
      const idBank = String(seriesObj['IDBANK'] ?? '');
      const indexType = SERIES_IDS[idBank];

      if (!indexType) {
        continue;
      }

      const observations = this.ensureArray(
        (seriesObj['Obs'] ?? seriesObj['series:Obs']) as unknown,
      );

      for (const obs of observations) {
        const obsObj = obs as Record<string, unknown>;
        const obsQual = String(obsObj['OBS_QUAL'] ?? '');

        if (obsQual !== 'DEF') {
          continue;
        }

        const timePeriod = String(obsObj['TIME_PERIOD'] ?? '');
        const obsValue = String(obsObj['OBS_VALUE'] ?? '');
        const dateJo = String(obsObj['DATE_JO'] ?? '');

        const parsed = this.parseTimePeriod(timePeriod);
        if (!parsed) {
          continue;
        }

        const value = parseFloat(obsValue);
        if (isNaN(value)) {
          continue;
        }

        results.push({
          type: indexType,
          quarter: parsed.quarter,
          year: parsed.year,
          value,
          publishedAt: dateJo || new Date().toISOString(),
        });
      }
    }

    return results;
  }

  private parseTimePeriod(
    timePeriod: string,
  ): { quarter: string; year: number } | null {
    const match = timePeriod.match(/^(\d{4})-Q(\d)$/);
    if (!match) {
      return null;
    }

    const year = parseInt(match[1], 10);
    const quarterNum = parseInt(match[2], 10);

    if (quarterNum < 1 || quarterNum > 4) {
      return null;
    }

    return { quarter: `Q${quarterNum}`, year };
  }

  private ensureArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }
    if (value != null) {
      return [value];
    }
    return [];
  }
}
