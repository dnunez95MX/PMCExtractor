#!/usr/bin/env node

import { getApiKey } from "./authorization.js";
import { retrieveRecords } from "./retrieveRecords.js";
import { exportRecordData } from "./handleExportRecordData.js";
import getSearchTerms from "./queryBuilder.js";
import chalk from "chalk";
import boxen from "boxen";

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
const records = await retrieveRecords(key, search_terms);
await exportRecordData(records);

// if (key === "puto") {
//   axios.get(url, { headers: { Accept: "application/json" } }).then((res) => {
//     console.log(res.data.joke);
//   });
// }
