import { utils, writeFile } from "xlsx";

export const exportRecordData = (records, { keyword, country }) => {
  // records.forEach((x) => {
  //   console.log(x);
  // });

  const cleanedRecords = records.map((rec) => {
    return {
      Title: rec.title,
      "Publication Year": rec.pubDate,
      "First Author": rec.firstAuthor.name ?? null,
      "First Author Email": rec.firstAuthor.email ?? null,
      "Institution First Author": rec.firstAuthor.affiliations ?? null,
      "Last Author": rec.lastAuthor?.name ?? null,
      "Last Author Email": rec.lastAuthor?.email ?? null,
      "Institution Last Author": rec.lastAuthor?.affiliations ?? null,
      "Corresponding Author": rec.correspondingAuthor?.name ?? null,
      "Corresponding Author Email": rec.correspondingAuthor?.email ?? null,
      "Institution Corresponding Author":
        rec.correspondingAuthor?.affiliations ?? null,
      Link: rec.link,
    };
  });

  console.log(records.length);

  function exportToExcel(data, fileName = "datos.xlsx") {
    const worksheet = utils.json_to_sheet(data, { skipHeader: true });

    const headers = Object.keys(data[0]);

    const headerStyle = {
      font: {
        bold: true, // Texto en negrita
        color: { rgb: "000000" }, // Color negro
        sz: 12, // Tamaño de fuente
        name: "Arial", // Tipo de fuente
      },
      fill: {
        patternType: "solid",
        fgColor: { rgb: "D9E1F2" }, // Fondo azul claro
      },
      border: {
        top: { style: "medium", color: { rgb: "000000" } }, // Borde superior grueso
        bottom: { style: "medium", color: { rgb: "000000" } }, // Borde inferior grueso
        left: { style: "thin", color: { rgb: "000000" } }, // Borde izquierdo fino
        right: { style: "thin", color: { rgb: "000000" } }, // Borde derecho fino
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    };

    headers.forEach((header, colIndex) => {
      const cellAddress = utils.encode_cell({ r: 0, c: colIndex });
      worksheet[cellAddress] = {
        v: header,
        t: "s", // Tipo string
        s: headerStyle,
      };

      // Ajustar ancho de columna
      const maxLength = Math.max(
        header.length,
        ...data.map((row) => String(row[headers[colIndex]]).length)
      );
      worksheet["!cols"] = worksheet["!cols"] || [];
      worksheet["!cols"][colIndex] = {
        width: maxLength + 1,
        bold: true,
        border: { style: "medium", color: "D9E1F2" },
      };
    });

    // Congelar la fila de headers
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2" };
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, `PMC_${keyword}_${country}`);
    writeFile(workbook, fileName);
  }

  exportToExcel(cleanedRecords, "publications.xlsx");
};
