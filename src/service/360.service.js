const prisma = require("../../prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const moment = require("moment");
const { generateSlotByTime } = require("../utils/utility");

const ourCustomerDetailsService = async (query = {}) => {
    const { page = 1, size = 10 } = query;

    const userList = prisma.user.findMany({
        where: {
            role: "user"
        },
        skip: page * size,
        take: size
    });

}

//user details by id

const getDateBasedConfigService = async (query = {}) => {
    const { date = mull, courtType = null } = query;

    if (!date || !courtType) {
        throw new AppError("Date is required");
    }

    const isDateExsistInCustomSlot = await prisma.eachDaySetting.findFirst({
        where: {
            date: new Date(date),
            courtType: courtType
        }
    });

    const bookedSlotlistFromDb = await prisma.bookingSlot.findMany({
        where: {
            date: new Date(date),
            courtType: courtType,
        }
    })


    if (isDateExsistInCustomSlot) {
        return {
            date: isDateExsistInCustomSlot.date,
            startTime: isDateExsistInCustomSlot.startTime,
            endTime: isDateExsistInCustomSlot.endTime,
            isHoliday: isDateExsistInCustomSlot.isHoliday,
            bookedSlot: bookedSlotlistFromDb.map(i => i.slotBookedTime.split(',')).flat(),
            eachSlotPrice: isDateExsistInCustomSlot.eachSlotPrice

        }
    }

    const defaultConfig = await prisma.allDaySetting.findFirst({
        where: {
            courtType: courtType
        }
    });

    const isHoliday = defaultConfig.defaultWeekdayHoliday.split(',').map(i => i.toLocaleLowerCase()).includes(moment(date).format("dddd").toLocaleLowerCase());

    return {
        date: defaultConfig.date,
        startTime: defaultConfig.everydayStartTime,
        endTime: defaultConfig.everydayEndTime,
        isHoliday: isHoliday,
        bookedSlot: bookedSlotlistFromDb.map(i => i.slotBookedTime.split(',')).flat(),
        eachSlotPrice: defaultConfig.eachSlotPrice


    }





}



const createOrUpdateUserInfo = async ({
    userName = "",
    userMobileNum = ""
}) => {

    const isExisit = await prisma.user.findFirst({
        where: {
            mobile: userMobileNum,
        }
    });

    if (isExisit) {
        return isExisit;
    } else {
        await prisma.user.create({
            data: {
                mobile: userMobileNum,
                name: userName,
            }
        })
    }

    const updatedval = await prisma.user.findFirst({
        where: {
            mobile: userMobileNum,
        }
    });

    return updatedval;

}

const bookingSlotService = async (payload) => {
    const {
        slotList = [],
        bookedBy = "USER",
        date = "",
        courtType = "",
        paidAmount = 0,
        balAmoun = 0,
        userName = "",
        UserMobileNum = "",
    } = payload;

    const user = await createOrUpdateUserInfo({
        userName: userName,
        userMobileNum: UserMobileNum
    })



    const checkBookedSlotList = await prisma.bookingSlot.findMany({
        where: {
            date: new Date(date),
            courtType: courtType,
        }
    });



    if (checkBookedSlotList.length != 0) {
        let ar = checkBookedSlotList.map(i => i.slotBookedTime);
        let bookedAlready = slotList.find(i => ar.includes(i));

        if (bookedAlready) {
            throw new Error('Already Booked Slot there on this time');
        }
    }



    const isDateExsistInCustomSlot = await prisma.eachDaySetting.findFirst({
        where: {
            date: new Date(date),
            courtType: courtType
        }
    });



    let responce = null;
    if (isDateExsistInCustomSlot) {
        responce = await prisma.bookingSlot.create({
            data: {
                courtType,
                date: new Date(date),
                slotBookedTime: slotList.join(','),
                userId: user.id,
                paidAmount: paidAmount,
                bookedBy: bookedBy,
                balAmount: (isDateExsistInCustomSlot.eachSlotPrice * slotList.length) - paidAmount,
            }
        })
    } else {

        let commonDateSlot = await prisma.allDaySetting.findFirst({
            where: {
                courtType: courtType
            }
        });

        console.log(commonDateSlot, 'comeon');


        const seletedDay = moment(date).format('dddd').toLowerCase();
        console.log(seletedDay, "selete");

        if (!commonDateSlot) {
            throw new Error("somthig went wrong");
        }

        if (commonDateSlot.defaultWeekdayHoliday.split(',').includes(seletedDay)) {
            throw new Error("this is holiday you can't book")
        }

        // let slots = generateSlotByTime({ end: commonDateSlot.everydayEndTime, start: commonDateSlot.everydayStartTime }).map(i => i.start);
        // console.log(slots, 'slotss');

        // for (let i = 0; i < slotList.length; i++) {
        //     if (!slots.includes(slotList[i])) {
        //         throw new Error("this slot is not available")
        //     }
        // }



        responce = await prisma.bookingSlot.create({
            data: {
                courtType: courtType,
                date: new Date(date),
                slotBookedTime: slotList.join(','),
                paidAmount: paidAmount,
                bookedBy: bookedBy,
                userId: user.id,
                balAmount: (commonDateSlot.eachSlotPrice * slotList.length) - paidAmount,
            }
        })

    }

    return responce;

}


const dashboardInfoService = async (payload) => {
    const { date } = payload;

    if (!date) {
        throw new Error("date is required")
    }
    const totalBooking = await prisma.bookingSlot.count({
        where: {
            date: {
                gte: moment().startOf('month').toDate(),  // first day of month
                lte: moment().endOf('month').toDate(),    // optional: last day of month
            },
        },
    });

    const totalSlotbooing = await prisma.bookingSlot.findMany({
        where: {
            date: {
                gte: moment().startOf('month').toDate(),  // first day of month
                lte: moment().endOf('month').toDate(),    // optional: last day of month
            },
        },
    });

    const totalSlotBooingCount  = totalSlotbooing.map(i => i.slotBookedTime.split(',')).flat().length




    const totalEarning = await prisma.bookingSlot.aggregate({
        _sum: {
            paidAmount: true
        },
        where: {
            date: {
                gte: moment().startOf('month').toDate(),  // first day of month
                lte: moment().endOf('month').toDate(),    // optional: last day of month
            },
        }
    });

    const selectedDateTotalBooking = await prisma.bookingSlot.count({
        where: {
            date: new Date(date)
        }
    });

    const selectedDaytotalSlotBooking = await prisma.bookingSlot.findMany({
        where: {
            date: new Date(date)
        },
    })

    const selectedDaytotalSlotBookingCount = selectedDaytotalSlotBooking.map(i => i.slotBookedTime.split(',')).flat().length

    const selectedDateTotalEaring = await prisma.bookingSlot.aggregate({
        _sum: {
            paidAmount: true
        },
        where: {
            date: new Date(date)
        }
    })

    let courtType = ['1', `2`, '3', '4'];

    const selectedDateTimeConfig = await prisma.eachDaySetting.findMany({
        where: {
            date: new Date(date)
        }
    });

    if (selectedDateTimeConfig.length == 0) {
        selectedDateTimeConfig.map(i => {
            if (courtType.includes(i.courtType)) {
                courtType = courtType.filter(c => c !== i.courtType);
            }
        })
    }



    const allDayConfig = await prisma.allDaySetting.findMany({
        where: {
            courtType: {
                in: courtType
            }
        }
    })



    return {
        totalBooking,
        totalEarning,
        selectedDateTotalBooking,
        selectedDaytotalSlotBookingCount,
        totalSlotBooingCount,
        selectedDateTotalEaring,
        selectedDateTotalEaring: selectedDateTotalEaring._sum.paidAmount || 0,
        totalBookingAmount: totalEarning._sum.paidAmount || 0,
        allDayConfig,
        selectedDateTimeConfig

    };
};

const bookingSlotListService = async (query) => {
    const { date, courtType } = query;
    const totalBooking = await prisma.bookingSlot.findMany({
        where: {
            courtType,

            date: new Date(date)

        },
        include: {
            user: true,
            _count: true
        }
    });


    return totalBooking;
}


/**
 * Create or update AllDaySetting for a courtType
 * and ensure holidates are created/updated in EachDaySetting as holidays.
 *
 * payload: { courtType, startTime, endTime, holidates: string[] }
 */
const createOrUpdateAllDaySettingService = async (payload) => {
    const { configType, courtType, startTime, endTime, isThisDayHoliday, eachSlotPrice, particularDate, holidates = [], } = payload;


    if (configType == 1) {
        let allDay = await prisma.allDaySetting.findFirst({ where: { courtType } });

        const defaultWeekdayHoliday = holidates.length ? holidates.join(',') : null;

        if (allDay) {
            allDay = await prisma.allDaySetting.update({
                where: { id: allDay.id },
                data: {
                    everydayStartTime: startTime,
                    everydayEndTime: endTime,
                    defaultWeekdayHoliday,
                    eachSlotPrice,
                    updatedAt: new Date()
                }
            });
        } else {
            allDay = await prisma.allDaySetting.create({
                data: {
                    courtType,
                    everydayStartTime: startTime,
                    everydayEndTime: endTime,
                    defaultWeekdayHoliday
                }
            });
        }

        const updated = await prisma.allDaySetting.findFirst({ where: { courtType } });
        return updated;
    } else if (configType == 2) {

        const particularDay = await prisma.eachDaySetting.findFirst({
            where: {
                courtType,
                date: new Date(particularDate)
            }
        });


        if (particularDay) {
            await prisma.eachDaySetting.update({
                where: { id: particularDay.id },
                data: {
                    startTime: isThisDayHoliday ? null : startTime,
                    endTime: isThisDayHoliday ? null : endTime,
                    isHoliday: isThisDayHoliday,
                    updatedAt: new Date(),
                    eachSlotPrice:eachSlotPrice
                }
            });
        } else {

            let s = await prisma.eachDaySetting.create({
                data: {
                    courtType,
                    date: new Date(particularDate),
                    startTime: isThisDayHoliday ? null : startTime,
                    endTime: isThisDayHoliday ? null : endTime,
                    isHoliday: isThisDayHoliday,
                    eachSlotPrice:eachSlotPrice
                }
            });

        }

        const updated = await prisma.eachDaySetting.findFirst({
            where: {
                courtType,
                date: new Date(particularDate)
            }
        });
        return updated;

    } else {
        return null;
    }

    // Upsert AllDaySetting by courtType (find -> update or create)


    // Process holidates array: create or update EachDaySetting entries as holidays
    //   for (const dateStr of holidates) {
    //     if (!dateStr) continue;
    //     const dateObj = new Date(dateStr);
    //     // normalize to midnight for date-only matching
    //     dateObj.setHours(0, 0, 0, 0);

    //     const existing = await prisma.eachDaySetting.findFirst({
    //       where: { courtType, date: dateObj }
    //     });

    //     if (existing) {
    //       await prisma.eachDaySetting.update({
    //         where: { id: existing.id },
    //         data: {
    //           isHoliday: true,
    //           startTime: null,
    //           endTime: null,
    //           updatedAt: new Date()
    //         }
    //       });
    //     } else {
    //       await prisma.eachDaySetting.create({
    //         data: {
    //           courtType,
    //           date: dateObj,
    //           startTime: null,
    //           endTime: null,
    //           isHoliday: true
    //         }
    //       });
    //     }
    //   }


};

const getAllDaySettingService = async (req = {}) => {

    const { configType, courtType, date, id } = req;

    if (configType == '1') {

        const responce = await prisma.allDaySetting.findUnique({
            where: {
                id: Number(id),
            }
        });

        return responce;

    } else if (configType == '2') {

        const responce = await prisma.eachDaySetting.findUnique({
            where: {
                id: Number(id),
            }
        });

        return responce;

    } else {
        return null
    }

}

const getSettingListService = async (query = {}) => {
    const { page = 1, size = 10, configType = 1 } = query;

    // Convert page/size to numbers and adjust page to be 0-based
    const pageNum = Number(page) - 1; // Convert 1-based to 0-based
    const sizeNum = Number(size);

    if (configType == "1") {
        const settingList = await prisma.allDaySetting.findMany({
            skip: pageNum * sizeNum, // Skip previous pages
            take: sizeNum,
            orderBy: {
                createdAt: 'desc' // Optional: add sorting
            }
        });

        // Get total count for pagination
        const total = await prisma.allDaySetting.count();

        return {
            data: settingList,
            page: Number(page),
            size: sizeNum,
            total,
            pages: Math.ceil(total / sizeNum)
        };
    } else if (configType == "2") {
        const settingList = await prisma.eachDaySetting.findMany({
            skip: pageNum * sizeNum, // Skip previous pages
            take: sizeNum,
            orderBy: {
                createdAt: 'desc' // Optional: add sorting
            }
        });
        const total = await prisma.eachDaySetting.count();

        return {
            data: settingList,
            page: Number(page),
            size: sizeNum,
            total,
            pages: Math.ceil(total / sizeNum)
        };
    }

}


const deleteSettingService = async (query = {}) => {
    const { configType, id } = query;

    if (configType == "1") {
        throw Error("All day settings cannot be deleted");
        const deleted = await prisma.allDaySetting.delete({
            where: {
                id: Number(id)
            }
        });

        return deleted;
    } else if (configType == "2") {
        const deleted = await prisma.eachDaySetting.delete({
            where: {
                id: Number(id)
            }
        });

        return deleted;
    }
}

module.exports = {
    ourCustomerDetailsService,
    getDateBasedConfigService,
    createOrUpdateAllDaySettingService,
    getAllDaySettingService,
    getSettingListService,
    bookingSlotService,
    dashboardInfoService,
    deleteSettingService,
    bookingSlotListService
}

