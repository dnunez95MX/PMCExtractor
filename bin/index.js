#!/usr/bin/env node

import { getApiKey } from "./authorization.js";
import { retrieveRecords } from "./retrieveRecords.js";
import { exportRecordData } from "./handleExportRecordData.js";
import getSearchTerms from "./queryBuilder.js";
import chalk from "chalk";
import boxen from "boxen";

// https://account.ncbi.nlm.nih.gov/?back_url=https%3A//account.ncbi.nlm.nih.gov/settings/
// https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=12166945&api_key=e932b4ee109be3a91c2e12e3da9599bb3408
// https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=organoid[Body%20All]+AND+japan[Affiliation]+AND+2025[DP]&retmax=100&api_key=e932b4ee109be3a91c2e12e3da9599bb3408

const greeting = chalk.white.bold("PMC Extractor");

const boxenOptions = {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "green",
  backgroundColor: "#555555",
};
const msgBox = boxen(greeting, boxenOptions);

const url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

console.log(msgBox);

const key = await getApiKey();
console.log(key);
const search_terms = await getSearchTerms();
console.log(search_terms);
const res = await retrieveRecords(key, search_terms);
const records = res.records;
const unreachableArticles = res.unreachableArticles;
await exportRecordData(records, unreachableArticles, search_terms);

// if (key === "puto") {
//   axios.get(url, { headers: { Accept: "application/json" } }).then((res) => {
//     console.log(res.data.joke);
//   });
// }
