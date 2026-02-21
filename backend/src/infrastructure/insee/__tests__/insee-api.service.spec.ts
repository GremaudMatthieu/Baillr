import { InseeApiService } from '../insee-api.service';

// SDMX 2.1 format (real INSEE BDM API response)
const VALID_XML = `<?xml version="1.0" encoding="UTF-8"?>
<message:StructureSpecificData xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message" xmlns:ss="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/data/structurespecific">
  <message:DataSet ss:dataScope="DataStructure">
    <Series IDBANK="001515333" TITLE_FR="Indice de référence des loyers (IRL)">
      <Obs TIME_PERIOD="2025-Q4" OBS_VALUE="145.78" OBS_QUAL="DEF" DATE_JO="2026-01-16"/>
      <Obs TIME_PERIOD="2025-Q3" OBS_VALUE="145.47" OBS_QUAL="DEF" DATE_JO="2025-10-15"/>
      <Obs TIME_PERIOD="2025-Q2" OBS_VALUE="145.17" OBS_QUAL="P"/>
      <Obs TIME_PERIOD="2025-Q1" OBS_VALUE="144.51" OBS_QUAL="DEF" DATE_JO="2025-04-11"/>
    </Series>
    <Series IDBANK="001532540" TITLE_FR="Indice des loyers commerciaux (ILC)">
      <Obs TIME_PERIOD="2025-Q4" OBS_VALUE="134.58" OBS_QUAL="DEF" DATE_JO="2026-01-22"/>
      <Obs TIME_PERIOD="2025-Q3" OBS_VALUE="133.07" OBS_QUAL="DEF" DATE_JO="2025-10-17"/>
    </Series>
    <Series IDBANK="000008630" TITLE_FR="Indice du coût de la construction (ICC)">
      <Obs TIME_PERIOD="2025-Q3" OBS_VALUE="2227" OBS_QUAL="DEF" DATE_JO="2026-01-10"/>
      <Obs TIME_PERIOD="2025-Q2" OBS_VALUE="2201" OBS_QUAL="DEF" DATE_JO="2025-10-08"/>
    </Series>
  </message:DataSet>
</message:StructureSpecificData>`;

const SINGLE_SERIES_XML = `<?xml version="1.0" encoding="UTF-8"?>
<message:StructureSpecificData xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message">
  <message:DataSet>
    <Series IDBANK="001515333" TITLE_FR="IRL">
      <Obs TIME_PERIOD="2025-Q4" OBS_VALUE="145.78" OBS_QUAL="DEF" DATE_JO="2026-01-16"/>
    </Series>
  </message:DataSet>
</message:StructureSpecificData>`;

const ALL_PROVISIONAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<message:StructureSpecificData xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message">
  <message:DataSet>
    <Series IDBANK="001515333" TITLE_FR="IRL">
      <Obs TIME_PERIOD="2025-Q4" OBS_VALUE="145.78" OBS_QUAL="P"/>
      <Obs TIME_PERIOD="2025-Q3" OBS_VALUE="145.47" OBS_QUAL="P"/>
    </Series>
  </message:DataSet>
</message:StructureSpecificData>`;

// SDMX 2.0 legacy format (backward compatibility)
const LEGACY_V20_XML = `<?xml version="1.0" encoding="UTF-8"?>
<message:MessageGroup xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_0/message">
  <message:DataSet>
    <Series IDBANK="001515333" TITLE_FR="IRL">
      <Obs TIME_PERIOD="2025-Q4" OBS_VALUE="145.78" OBS_QUAL="DEF" DATE_JO="2026-01-16"/>
    </Series>
  </message:DataSet>
</message:MessageGroup>`;

describe('InseeApiService', () => {
  let service: InseeApiService;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    service = new InseeApiService();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchLatestIndices', () => {
    it('should parse multi-series XML and return only DEF observations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(VALID_XML),
      });

      const results = await service.fetchLatestIndices();

      // 3 IRL DEF + 2 ILC DEF + 2 ICC DEF = 7 (Q2 IRL is "P" so excluded)
      expect(results).toHaveLength(7);

      // Check IRL entries
      const irl = results.filter((r) => r.type === 'IRL');
      expect(irl).toHaveLength(3);
      expect(irl[0]).toEqual({
        type: 'IRL',
        quarter: 'Q4',
        year: 2025,
        value: 145.78,
        publishedAt: '2026-01-16',
      });

      // Check ILC entries
      const ilc = results.filter((r) => r.type === 'ILC');
      expect(ilc).toHaveLength(2);
      expect(ilc[0]).toEqual({
        type: 'ILC',
        quarter: 'Q4',
        year: 2025,
        value: 134.58,
        publishedAt: '2026-01-22',
      });

      // Check ICC entries
      const icc = results.filter((r) => r.type === 'ICC');
      expect(icc).toHaveLength(2);
      expect(icc[0]).toEqual({
        type: 'ICC',
        quarter: 'Q3',
        year: 2025,
        value: 2227,
        publishedAt: '2026-01-10',
      });
    });

    it('should filter out provisional (OBS_QUAL="P") observations', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(VALID_XML),
      });

      const results = await service.fetchLatestIndices();

      // IRL Q2 2025 has OBS_QUAL="P" so should NOT be in results
      const irlQ2 = results.find(
        (r) => r.type === 'IRL' && r.quarter === 'Q2' && r.year === 2025,
      );
      expect(irlQ2).toBeUndefined();
    });

    it('should return empty array when all observations are provisional', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(ALL_PROVISIONAL_XML),
      });

      const results = await service.fetchLatestIndices();
      expect(results).toHaveLength(0);
    });

    it('should handle single series response (not wrapped in array)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(SINGLE_SERIES_XML),
      });

      const results = await service.fetchLatestIndices();
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('IRL');
    });

    it('should correctly parse TIME_PERIOD to quarter and year', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(VALID_XML),
      });

      const results = await service.fetchLatestIndices();

      const q1 = results.find(
        (r) => r.type === 'IRL' && r.quarter === 'Q1',
      );
      expect(q1).toBeDefined();
      expect(q1!.year).toBe(2025);

      const q3 = results.find(
        (r) => r.type === 'IRL' && r.quarter === 'Q3',
      );
      expect(q3).toBeDefined();
      expect(q3!.year).toBe(2025);
    });

    it('should map IDBANK to correct index type', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(VALID_XML),
      });

      const results = await service.fetchLatestIndices();

      const types = [...new Set(results.map((r) => r.type))];
      expect(types).toEqual(expect.arrayContaining(['IRL', 'ILC', 'ICC']));
    });

    it('should call BDM API with correct URL and abort signal', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(VALID_XML),
      });

      await service.fetchLatestIndices();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/001515333+001532540+000008630?lastNObservations=4',
        expect.objectContaining({
          headers: { Accept: 'application/xml' },
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should throw InseeApiUnavailableException on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.fetchLatestIndices()).rejects.toThrow(
        'Le service INSEE est temporairement indisponible (erreur réseau).',
      );
    });

    it('should throw InseeApiUnavailableException on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.fetchLatestIndices()).rejects.toThrow(
        'Le service INSEE est temporairement indisponible (HTTP 500).',
      );
    });

    it('should throw InseeApiUnavailableException on invalid XML', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<invalid>not sdmx</invalid>'),
      });

      await expect(service.fetchLatestIndices()).rejects.toThrow(
        'Le service INSEE a renvoyé une réponse invalide.',
      );
    });

    it('should throw InseeApiUnavailableException on empty response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(service.fetchLatestIndices()).rejects.toThrow(
        'Le service INSEE',
      );
    });

    it('should use publishedAt from DATE_JO attribute', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(VALID_XML),
      });

      const results = await service.fetchLatestIndices();
      const irlQ4 = results.find(
        (r) => r.type === 'IRL' && r.quarter === 'Q4',
      );
      expect(irlQ4!.publishedAt).toBe('2026-01-16');
    });

    it('should also parse legacy SDMX v2.0 MessageGroup format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(LEGACY_V20_XML),
      });

      const results = await service.fetchLatestIndices();
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('IRL');
      expect(results[0].value).toBe(145.78);
    });

    it('should use current date as fallback when DATE_JO is missing', async () => {
      const xmlWithoutDateJo = `<?xml version="1.0" encoding="UTF-8"?>
<message:StructureSpecificData xmlns:message="http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message">
  <message:DataSet>
    <Series IDBANK="001515333" TITLE_FR="IRL">
      <Obs TIME_PERIOD="2025-Q4" OBS_VALUE="145.78" OBS_QUAL="DEF"/>
    </Series>
  </message:DataSet>
</message:StructureSpecificData>`;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(xmlWithoutDateJo),
      });

      const results = await service.fetchLatestIndices();
      expect(results[0].publishedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });
  });
});
