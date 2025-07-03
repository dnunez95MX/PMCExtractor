import axios from "axios";

export const retrieveRecords = async (api_key, search_terms) => {
  //   query = f"({search_term}[Body All]) AND {country}[Affiliation]"
  //     if year:
  //         query += f" AND {year}[DP]"
  //     print("Verwende Suchanfrage:", query)
  const query = `(${search_terms.keyword}[Body All] AND ${search_terms.country}[Affiliation] AND ${search_terms.year}[DP]`;

  //   """
  // Retrieves all article IDs (PMCID) via esearch with pagination.
  // Adapted from the provided code.
  // """
  //   const esearch_url =
  //     "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

  //const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

  const url =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&api_key=e932b4ee109be3a91c2e12e3da9599bb3408&id=25125";

  console.log(query);

  //   const params = {
  //     db: "pmc",
  //     term: query,
  //     retmax: search_terms.maxRecords,
  //     retstart: 0,
  //     retmode: "xml",
  //     api_key: api_key,
  //   };

  const params = {
    db: "pmc",
    id: "25125",
    api_key: api_key,
  };

  axios.interceptors.request.use((request) => {
    console.log("Starting Request", JSON.stringify(request, null, 2));
    return request;
  });

  axios
    .get(url)
    .then((x) => {
      console.log(x.data);
    })
    .catch(() => {
      console.log("error");
    });

  //   const response = await axios.get(esearch_url, params);
  //   console.log(response);
};
