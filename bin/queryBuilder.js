import readlineSync from "readline-sync";

const getSearchTerms = async () => {
  //   search_term = input(
  //     "Geben Sie den Suchbegriff ein (z.B. Organoid): "
  //   ).strip();
  //   country = input("Geben Sie das Land ein (z.B. Japan): ").strip();
  //   year = input(
  //     "Geben Sie das Jahr der Publikation ein (optional, z.B. 2020): "
  //   ).strip();

  let specificYear;
  let startYear;
  let endYear;

  const keyword = await readlineSync.question(
    "Enter a search term (z.B. Organoid): "
  );

  const country = await readlineSync.question("Enter a country (z.B. Japan): ");

  let options = ["Retrieve All", "Get Specific Year", "Search by Year Range"];

  let index = readlineSync.keyInSelect(options, "Publication Date?");
  console.log("Ok, " + options[index]);

  if (index == 1) {
    specificYear = await readlineSync.questionInt(
      "Enter year of publication (z.B. 2020): ",
      { defaultInput: null }
    );
  } else if (index == 2) {
    startYear = await readlineSync.questionInt(
      "Enter start year range of publication (z.B. 2020): ",
      { defaultInput: null }
    );
    endYear = await readlineSync.questionInt(
      "Enter end year range of publication (optional, z.B. 2025): ",
      { defaultInput: null }
    );
  } else if (index == 0) {
  } else {
    console.log("Aborted");
    return;
  }

  // const maxRecords = await readlineSync.getRawInput(
  //   "Enter the maximum number of records to retrieve per search (RETMAX): "
  // );

  return {
    keyword,
    country,
    specificYear,
    startYear,
    endYear,
  };
};

export default getSearchTerms;
