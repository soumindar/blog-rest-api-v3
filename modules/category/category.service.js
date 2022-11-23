const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getData = async (req, res) => {
  try {
    const { pagination, page, order_by, order } = req.query;

    const limit = pagination ?? 10;
    const pages = page ?? 1;
    const offset = (pages - 1) * limit;
    const orderBy = order_by ?? 'category';
    const orderKey = order ?? 'asc';

    let getCategory;
    if (orderBy === 'id') {
      getCategory = await prisma.category.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          id: orderKey
        }
      });
    } else {
      getCategory = await prisma.category.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          category: orderKey
        }
      });
    }

    const getDataAmount = await prisma.category.aggregate({
      _count: {
        category: true
      }
    });
    const dataAmount = getDataAmount._count.category;
    const maxPage = Math.ceil(dataAmount / limit);
    
    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: getCategory,
      meta: {
        pagination: Number(limit),
        page: Number(pages),
        data_amount: Number(dataAmount),
        max_page: Number(maxPage)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

module.exports = {
  getData,
};