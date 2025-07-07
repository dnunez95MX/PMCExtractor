import axios from "axios";
import xml2js from "xml2js";

export const retrieveRecords = async (api_key, search_terms) => {
  // const url =
  //   "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pmc&api_key=e932b4ee109be3a91c2e12e3da9599bb3408&id=25125";

  // const fetchUrl =
  //   "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=9063264&api_key=e932b4ee109be3a91c2e12e3da9599bb3408";

  // const fetchUrl =
  //   "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=6881327&api_key=e932b4ee109be3a91c2e12e3da9599bb3408";

  //   const fetchUrl =
  //     "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=11276855&api_key=e932b4ee109be3a91c2e12e3da9599bb3408";

  //   const fetchUrl =
  //     "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=10647544&api_key=e932b4ee109be3a91c2e12e3da9599bb3408";
  //   console.log(query);

  const fetchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

  const searchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

  let articleIds = [];
  let records = [];
  let corresp_emails = [];

  // axios.interceptors.request.use((request) => {
  //   console.log("Starting Request", JSON.stringify(request, null, 2));
  //   return request;
  // });

  // 2. Parse XML to JSON
  const parser = new xml2js.Parser({
    explicitArray: false, // Don't always create arrays for single elements
    mergeAttrs: true, // Merge attributes with child elements
    ignoreAttrs: false, // Don't ignore XML attributes
  });

  const params = await buildParamsQuery();

  await axios
    .get(searchUrl, {
      headers: {
        Accept: "application/xml", // Ensure you get XML response
      },
      params: params,
    })
    .then(async (response) => {
      let result = await parser.parseStringPromise(response.data);
      let idList = result.eSearchResult.IdList.Id;

      if (Array.isArray(idList)) {
        idList.map((i) => {
          articleIds.push(i);
        });
      } else {
        articleIds.push(idList);
      }
      await getRecordsData();
    })
    .catch((error) => {
      if (error.response) {
        // Error de respuesta HTTP (4xx, 5xx)
        console.error("Error del servidor:", error.response.status);
        console.error("Datos del error:", error.response.data);
      } else if (error.request) {
        // No se recibió respuesta
        console.error("No se recibió respuesta:", error.request);
      } else {
        // Error en la configuración
        console.error("Error al configurar la solicitud:", error.message);
      }
    });

  async function getRecordsData() {
    let corr_author;

    const promises = articleIds.map(async (art) => {
      console.log(art);
      try {
        const response = await axios.get(fetchUrl, {
          headers: {
            Accept: "application/xml",
          },
          params: {
            db: "pmc",
            id: art,
            api_key: api_key,
          },
        });

        let result = await parser.parseStringPromise(response.data);

        let title =
          result["pmc-articleset"].article.front["article-meta"]["title-group"][
            "article-title"
          ];

        let link = `https://pmc.ncbi.nlm.nih.gov/articles/PMC${art}/`;

        let contrib_group =
          result["pmc-articleset"].article.front["article-meta"][
            "contrib-group"
          ];

        let author_notes =
          result["pmc-articleset"].article.front["article-meta"][
            "author-notes"
          ];

        let affiliations = contrib_group["aff"];

        let authors = [];

        if (Array.isArray(contrib_group)) {
          console.log(contrib_group);
          contrib_group.map((con) => {
            if (Array.isArray(con.contrib)) {
              con.contrib.map((x) => {
                if (x["contrib-type"] == "author") {
                  authors.push(x);
                }
              });
            } else {
              if (con.contrib["contrib-type"] == "author") {
                authors.push(con.contrib);
              }
            }
          });
        } else {
          if (Array.isArray(contrib_group.contrib)) {
            contrib_group.contrib.map((x) => {
              if (x["contrib-type"] == "author") {
                authors.push(x);
              }
            });
          } else {
            if (contrib_group.contrib["contrib-type"] == "author") {
              authors.push(contrib_group.contrib);
            }
          }
        }

        let first_author = authors[0];
        let last_author = authors[authors.length - 1];

        const corrEmails = author_notes?.corresp?.email ?? [];

        const getCorrEmails = (emails) =>
          Array.isArray(emails) ? emails[0] : emails;

        corresp_emails = getCorrEmails(corrEmails);

        corr_author = authors.filter((a) => {
          let ref = a.xref;
          //revisar excepcion donde existe un email pero no esta relacionado con ninguna autor
          if (ref) {
            if (Array.isArray(ref)) {
              return ref.find((x) => x["ref-type"] === "corresp");
            } else {
              let authRef = ref["ref-type"] === "corresp";
              if (authRef) {
                return authRef;
              }
            }
          }
        });

        const record = await handleAuthorData(
          affiliations,
          first_author,
          last_author,
          corr_author,
          corresp_emails,
          title,
          link
        );

        records.push(record);
      } catch (error) {
        // 5. Manejar diferentes tipos de errores
        if (error.response) {
          // Error de respuesta HTTP (4xx, 5xx)
          console.error("Error del servidor:", error.response.status);
          console.error("Datos del error:", error.response.data);
        } else if (error.request) {
          // No se recibió respuesta
          console.error("No se recibió respuesta:", error.request);
        } else {
          // Error en la configuración
          console.error("Error al configurar la solicitud:", error.message);
        }

        return null;
      }
    });

    await Promise.all(promises);
  }

  async function buildParamsQuery() {
    let query = `(${search_terms.keyword}[Body All] AND ${search_terms.country}[Affiliation]`;
    if (search_terms.year > 0) {
      query += `AND ${search_terms.year}[DP]`;
    }

    let params = {
      db: "pmc",
      term: query,
      retmax: search_terms.maxRecords,
      api_key: api_key,
    };

    return params;
  }

  async function handleAuthorData(
    affiliations,
    fa,
    la,
    ca,
    corEmails,
    title,
    link
  ) {
    //console.log(fa);
    //console.log(la);
    // console.log(ca);
    // console.log(corEmails);

    const getAffiliationsAuthor = (ref) => {
      let affiliationsAuthor = [];
      if (ref) {
        if (Array.isArray(ref)) {
          ref.map((r) => {
            let aff = affiliations.find(
              (af) => af.id.toLowerCase() == r.rid.toLowerCase()
            );
            if (aff) {
              affiliationsAuthor.push(aff);
            }
          });
        } else {
          console.log("solo una referencia", ref);
        }
      }

      //   Object.values(affiliationsAuthor[0]["given-names"])[0] ??
      //  affiliationsAuthor[0]["institution-wrap"]
      return affiliationsAuthor[0];
    };

    const getConstructedName = (name) => {
      let constructedName = `${name.surname}, ${
        Object.values(name["given-names"])[0]
      }`;
      return constructedName;
    };

    const faRef = fa.xref;
    let firstAuthor = {
      name: getConstructedName(fa.name),
      email: fa.email,
      affiliations: getAffiliationsAuthor(faRef),
    };

    const laRef = la.xref;
    console.log(la);
    let lastAuthor = {
      name: getConstructedName(la.name),
      email: la.email ?? la.address.email,
      affiliations: getAffiliationsAuthor(laRef),
    };

    let recordData = {
      title,
      firstAuthor,
      lastAuthor,
      link,
    };
    return recordData;
  }

  return records;
};
