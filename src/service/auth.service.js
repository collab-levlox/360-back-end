const prisma = require("../../prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

const registerUser = async ({ name, email, password, role, mobile }) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { mobile }]
    }
  });

  if (existingUser) {
    throw new AppError("User already exists with this email pr mobile");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role ? role : "USER",
      mobile,
    },
  });

  return { id: newUser.id, email: newUser.email };
};

const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  // if (user.role != "ADMIN") {
  //   throw new AppError("your are not admin user", 401);
  // }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  return { token, user: { id: user.id, email: user.email, name: user.name, roles: user.role } };
};

const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
  return user;
};


module.exports = {
  registerUser,
  loginUser,
};
