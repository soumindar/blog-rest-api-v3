const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const moment = require('moment-timezone');
const userTimezone = require('../../config/timezone.config');

// get user data controller
const getData = async (req, res) => {
  try {
    const userId = req.user.id;    
    
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id: userId },
    });
    
    const data = {
      ...user,
      createdAt: moment(user.createdAt).tz(userTimezone).format(),
      updatedAt: (!user.updatedAt) ? null : moment(user.updatedAt).tz(userTimezone).format(),
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// get all users controller
const getAll = async (req, res) => {
  try {
    const { pagination, page } = req.query;

    const limit = pagination ?? 10;
    const pages = page ?? 1;
    const offset = (pages - 1) * limit;

    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        username: true,
      },
      where: { deleted: null },
      skip: offset,
      take: limit,
      orderBy: { name: 'asc' },
    });

    const getDataAmount = await prisma.users.aggregate({
      _count: {id: true},
      where: { deleted: null },
    });
    const dataAmount = getDataAmount._count.id;
    const maxPage = Math.ceil(dataAmount / limit);

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: users,
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

// get user by id controller
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        id: id,
        deleted: null,
      },
    });
    if (!user) {
      return res.status(400).json({
        message: 'user not found',
        statusCode: 404
      });
    }
    const data =  {
      ...user,
      createdAt: moment(user.createdAt).tz(userTimezone).format(),
      updatedAt: (!user.updatedAt) ? null : moment(user.updatedAt).tz(userTimezone).format(),
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
};

// get user by username controller
const getByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await prisma.users.findFirst({
      select: {
        id: true,
        name: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        username: username,
        deleted: null,
      },
    });
    if (!user) {
      return res.status(400).json({
        message: 'username not found',
        statusCode: 404
      });
    }
    const data =  {
      ...user,
      createdAt: moment(user.createdAt).tz(userTimezone).format(),
      updatedAt: (!user.updatedAt) ? null : moment(user.updatedAt).tz(userTimezone).format(),
    };

    return res.status(200).json({
      message: 'success',
      statusCode: 200,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// update user controller
const updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, username } = req.body;

    const usernameExist = await prisma.users.findFirst({
      select: { username: true },
      where: {
        username: username,
        id: {
          not: userId,
        }
      },
    });

    if (usernameExist) {
      return res.status(409).json({
        message: 'username is already exist',
        statusCode: 409
      });
    }

    await prisma.users.update({
      data: {
        name,
        username,
      },
      where: { id: userId },
    });

    return res.status(200).json({
      message: 'update success',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// change password controller
const changePass = async (req, res) => {
  try {
    const userId = req.user.id;
    const { new_pass, confirm_pass } = req.body;

    if (new_pass != confirm_pass) {
      return res.status(400).json({
        message: 'confirm_pass must be same with new_pass',
        statusCode: 400
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_pass, salt);

    await prisma.users.update({
      data: {
        password: hashedPassword,
        token: null,
      },
      where: { id: userId },
    });

    return res.status(200).json({
      message: 'change password success',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

// delete user controller
const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.users.update({
      data: {
        deleted: new Date(),
      },
      where: { id: userId },
    });

    return res.status(200).json({
      message: 'delete success',
      statusCode: 200
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: error.message,
      statusCode: 500
    });
  }
}

module.exports = {
  getData,
  getAll,
  getById,
  getByUsername,
  updateUser,
  changePass,
  deleteUser,
}