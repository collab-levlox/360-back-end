const data = require("../db");

const prisma = require("../../prisma");

const listingAllData = ({
  search = "",
  sort = "asc",
  filter = "",
  page = 1,
  size = 10,
}) => {
  page = Number(page);
  size = Number(size);
  let result = [...data];

  if (search) {
    const s = search.toLowerCase().trim();
    result = result.filter(
      (item) =>
        item.API.toLowerCase().includes(s) ||
        item.Description.toLowerCase().includes(s)
    );
  }

  if (filter && filter !== "All Categories") {
    result = result.filter((item) => item.Category === filter);
  }

  if (sort === "asc") result.sort((a, b) => a.API.localeCompare(b.API));
  if (sort === "desc") result.sort((a, b) => b.API.localeCompare(a.API));

  const start = (page - 1) * size;

  const totalPages = Math.ceil(result.length / size);
  const paginated = result.slice(start, start + size);

  return { total: result.length, page, size, data: paginated, totalPages };
};

const listingAllCategory = async () => {
  console.log("ulla vanta");

  try {
    const s = await prisma.user.count();
  } catch (error) {
    console.log(error, "popopo");
  }

  return [];
};

module.exports = { listingAllData, listingAllCategory };
