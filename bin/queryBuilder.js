import readlineSync from "readline-sync";

const getSearchTerms = async () => {
  //   search_term = input(
  //     "Geben Sie den Suchbegriff ein (z.B. Organoid): "
  //   ).strip();
  //   country = input("Geben Sie das Land ein (z.B. Japan): ").strip();
  //   year = input(
  //     "Geben Sie das Jahr der Publikation ein (optional, z.B. 2020): "
  //   ).strip();

  const keyword = await readlineSync.question(
    "Enter a search term (z.B. Organoid): "
  );

  const country = await readlineSync.question("Enter a country (z.B. Japan): ");

  const year = await readlineSync.questionInt(
    "Enter a year of publication (optional, z.B. 2020): ",
    { defaultInput: null }
  );

  const maxRecords = await readlineSync.questionInt(
    "Enter the maximum number of records to retrieve per search (RETMAX): ",
    {
      limit: 20,
      limitMessage: "Input valid number",
    }
  );

  return {
    keyword,
    country,
    year,
    maxRecords,
  };
};

export default getSearchTerms;
