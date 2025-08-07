import axios from "axios";
import xml2js from "xml2js";

export const retrieveRecords = async (api_key, search_terms) => {
  const fetchUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

  const searchUrl =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

  let articleIds = [];
  let records = [];
  let unreachableArticles = [];

  // axios.interceptors.request.use((request) => {
  //   console.log("Starting Request", JSON.stringify(request, null, 2));
  //   return request;
  // });

  // Parse XML to JSON
  const parser = new xml2js.Parser({
    explicitArray: false, // Don't always create arrays for single elements
    mergeAttrs: true, // Merge attributes with child elements
    ignoreAttrs: false, // Don't ignore XML attributes
  });

  try {
    let response;
    let fetchedArticleIds;

    if (search_terms.specificYear) {
      response = await axios.get(searchUrl, {
        headers: {
          Accept: "application/xml", // Ensure you get XML response
        },
        params: await buildParamsQuery(search_terms.specificYear),
      });

      let result = await parser.parseStringPromise(response.data);
      let idList = result.eSearchResult.IdList.Id;

      fetchedArticleIds = idList;
    } else if (search_terms.startYear < search_terms.endYear) {
      console.log(
        `Searching through range: ${search_terms.startYear} - ${search_terms.endYear}`
      );

      let articleRange = [];

      for (let i = search_terms.startYear; i < search_terms.endYear + 1; i++) {
        response = await axios.get(searchUrl, {
          headers: {
            Accept: "application/xml", // Ensure you get XML response
          },
          params: await buildParamsQuery(i),
        });

        let result = await parser.parseStringPromise(response.data);
        let idList = result.eSearchResult.IdList.Id;

        articleRange = articleRange.concat(idList);
      }

      fetchedArticleIds = articleRange;
    } else {
      response = await axios.get(searchUrl, {
        headers: {
          Accept: "application/xml", // Ensure you get XML response
        },
        params: await buildParamsQuery(),
      });

      let result = await parser.parseStringPromise(response.data);
      let idList = result.eSearchResult.IdList.Id;

      fetchedArticleIds = idList;
    }

    if (Array.isArray(fetchedArticleIds)) {
      fetchedArticleIds.map((i) => {
        articleIds.push(i);
      });
    } else {
      articleIds.push(idList);
    }

    console.log(`Total items found: ${fetchedArticleIds.length}`);

    for (const art of fetchedArticleIds) {
      await new Promise(async (resolve) => {
        const res = await getRecordsData(art);
        if (res) {
          records.push(res);
        }
        resolve();
      });
    }

    if (unreachableArticles.length > 0) {
      console.log("The following articles where not fetched: ");
      unreachableArticles?.map((x) => console.log(`Articicle ID: ${x}`));
    }

    let results = {
      records,
      unreachableArticles,
    };

    return results;
  } catch (error) {
    if (error.response) {
      // Error de respuesta HTTP (4xx, 5xx)
      console.error("Server error:", error.response.status);
      console.error("Detailed error:", error.response.data);
    } else if (error.request) {
      // No se recibió respuesta
      console.error("No se recibió respuesta:", error.request);
    } else {
      // Error en la configuración
      console.error("Error al configurar la solicitud:", error.message);
    }
  }

  async function getRecordsData(art) {
    let corr_author;
    let affiliations;

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
        result["pmc-articleset"].article.front["article-meta"]["contrib-group"];

      //CHECK CORRESPONDENCE TO
      let author_notes =
        result["pmc-articleset"].article.front["article-meta"]["author-notes"];

      let pubDateObject =
        result["pmc-articleset"].article.front["article-meta"]["pub-date"];

      let pubDate = Array.isArray(pubDateObject)
        ? pubDateObject[0].year
        : pubDateObject.year;

      affiliations =
        contrib_group["aff"] ??
        result["pmc-articleset"].article.front["article-meta"]["aff"];

      let authors = [];

      if (Array.isArray(contrib_group)) {
        contrib_group.map((con) => {
          if (Array.isArray(con.contrib)) {
            con.contrib.map((x) => {
              if (x["contrib-type"] == "author") {
                authors.push(x);
              }
              if (x["aff"]) {
                affiliations = x["aff"];
              }
            });
          } else {
            if (con.contrib["contrib-type"] == "author") {
              authors.push(con.contrib);
            }

            if (con.contrib["aff"]) {
              affiliations = con.contrib["aff"];
            }
          }
        });
      } else {
        if (Array.isArray(contrib_group.contrib)) {
          contrib_group.contrib.map((x) => {
            if (x["contrib-type"] == "author") {
              authors.push(x);

              if (x["aff"]) {
                affiliations = x["aff"];
              }
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

      corr_author = authors.find((a) => {
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
        title,
        link,
        pubDate
      );

      return record;
    } catch (error) {
      // 5. Manejar diferentes tipos de errores
      console.log(`ERROR: ${art}`);
      unreachableArticles.push(art);
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
  }

  async function handleAuthorData(
    affiliations,
    fa,
    la,
    ca,
    title,
    link,
    pubDate
  ) {
    const getAffiliationsAuthor = (ref) => {
      let affiliationsAuthor = [];

      if (affiliations) {
        if (Array.isArray(affiliations)) {
          if (!affiliations.some((af) => af.hasOwnProperty("id"))) {
            let institution = affiliations[0]?.institution ?? "";
            return institution;
          }
        } else if (!affiliations.hasOwnProperty("id")) {
          let institution = affiliations.institution ?? "";
          return institution;
        }

        if (ref) {
          if (Array.isArray(ref)) {
            ref.map((r) => {
              let aff;
              if (Array.isArray(affiliations)) {
                aff = affiliations.find(
                  (af) => af.id.toLowerCase() == r.rid.toLowerCase()
                );
              } else {
                aff =
                  affiliations.id.toLowerCase() == r.rid.toLowerCase()
                    ? affiliations
                    : "";
              }

              if (aff) {
                affiliationsAuthor.push(aff);
              }
            });
          } else {
            let aff;
            if (Array.isArray(affiliations)) {
              aff = affiliations.find(
                (af) => af.id.toLowerCase() == ref.rid.toLowerCase()
              );
            } else {
              aff =
                affiliations.id.toLowerCase() == ref.rid.toLowerCase()
                  ? affiliations
                  : "";
            }

            if (aff) {
              affiliationsAuthor.push(aff);
            }
          }
        }

        let mayorAff;

        if (affiliationsAuthor.length > 0) {
          mayorAff =
            affiliationsAuthor[0]["institution-wrap"]?.institution ??
            Object.values(affiliationsAuthor[0])[0];
        } else {
          mayorAff = "";
        }

        return Array.isArray(mayorAff) ? mayorAff.join("") : mayorAff;
      }

      return "";
    };

    const getConstructedName = (name) => {
      let constructedName = `${name.surname}, ${
        Object.values(name["given-names"])[0]
      }`;
      return constructedName;
    };

    const getConstructedEmail = (author) => {
      let constructedEmail = author.address?.email ?? author.email;
      return constructedEmail;
    };

    const getConstructedTitle = (title) => {
      let constructedTitle;
      if (typeof title === "object") {
        constructedTitle = Object.values(title)[0];
      } else if (typeof title === "string") {
        constructedTitle = title;
      }

      return constructedTitle;
    };

    const faRef = fa.xref;
    let firstAuthor = {
      name: getConstructedName(fa.name),
      email: getConstructedEmail(fa) ?? null,
      affiliations: getAffiliationsAuthor(faRef),
    };

    const laRef = la.xref;
    let lastAuthor = {
      name: getConstructedName(la.name),
      email: getConstructedEmail(la) ?? null,
      affiliations: getAffiliationsAuthor(laRef),
    };

    let correspondingAuthor;
    if (ca) {
      const caRef = ca.xref;
      correspondingAuthor = {
        name: getConstructedName(ca.name),
        email: getConstructedEmail(ca) ?? null,
        affiliations: getAffiliationsAuthor(caRef),
      };
    }

    let recordData = {
      title: getConstructedTitle(title),
      firstAuthor,
      lastAuthor,
      correspondingAuthor: correspondingAuthor ?? null,
      link,
      pubDate,
    };
    return recordData;
  }

  async function buildParamsQuery(publicationYear) {
    let query = `(${search_terms.keyword}[Body All] AND ${search_terms.country}[Affiliation]`;
    if (publicationYear) {
      query += ` AND ${publicationYear}[DP]`;
    }

    let params = {
      db: "pmc",
      term: query,
      retmax: 100000,
      api_key: api_key,
    };

    return params;
  }
};
