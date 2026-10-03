const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const answerQueue = [];
const answerWaiters = [];

rl.on("line", (answer) => {
  const resolve = answerWaiters.shift();
  if (resolve) {
    resolve(answer);
  } else {
    answerQueue.push(answer);
  }
});

function ask(question) {
  process.stdout.write(question);
  if (answerQueue.length > 0) {
    return Promise.resolve(answerQueue.shift());
  }
  return new Promise((resolve) => answerWaiters.push(resolve));
}

const membershipFees = {
  STANDARD: 500000,
  VIP: 800000,
};
const personalTrainerFee = 300000;

let registeredMembers = [];
let totalRevenue = 0;
let checkInCount = 0;
let running = true;

function validMemberCard(card) {
  const normalized = card.trim().toUpperCase();
  return normalized.startsWith("GYM-") && normalized.endsWith(String(new Date().getFullYear()));
}

function formatMoney(amount) {
  return `${amount.toLocaleString("vi-VN")} VND`;
}

async function registerMember() {
  const name = (await ask("Ho ten hoi vien: ")).trim();
  const card = (await ask("Ma the (vi du GYM-VIP-2026): "))
    .trim()
    .toUpperCase();

  if (!name || !validMemberCard(card)) {
    console.log(
      `Thong tin khong hop le. Ma the phai bat dau bang GYM- va ket thuc bang ${new Date().getFullYear()}.\n`
    );
    return;
  }
  if (registeredMembers.some((member) => member.card === card)) {
    console.log("Ma the nay da duoc dang ky.\n");
    return;
  }

  registeredMembers.push({ name, card, billed: false });
  console.log(`Da dang ky hoi vien ${name} (${card}).\n`);
}

async function calculateMembershipFee() {
  if (registeredMembers.length === 0) {
    console.log("Can dang ky hoi vien truoc khi tinh tien.\n");
    return;
  }

  console.log("Hoi vien chua tinh phi:");
  const availableMembers = registeredMembers.filter((member) => !member.billed);
  if (availableMembers.length === 0) {
    console.log("Tat ca hoi vien da duoc tinh phi.\n");
    return;
  }
  availableMembers.forEach((member, index) => {
    console.log(`${index + 1}. ${member.name} - ${member.card}`);
  });

  const selected = Number(await ask("Chon so thu tu hoi vien: "));
  if (!Number.isInteger(selected) || selected < 1 || selected > availableMembers.length) {
    console.log("So thu tu hoi vien khong hop le.\n");
    return;
  }

  const member = availableMembers[selected - 1];
  const plan = (await ask("Chon goi STANDARD/VIP: ")).trim().toUpperCase();
  if (!Object.prototype.hasOwnProperty.call(membershipFees, plan)) {
    console.log("Goi tap khong hop le.\n");
    return;
  }

  const months = Number(await ask("So thang dang ky: "));
  const ptSessions = Number(await ask("So buoi PT (0 neu khong thue): "));
  if (
    !Number.isInteger(months) ||
    months <= 0 ||
    !Number.isInteger(ptSessions) ||
    ptSessions < 0
  ) {
    console.log("So thang hoac so buoi PT khong hop le.\n");
    return;
  }

  const membershipSubtotal = membershipFees[plan] * months;
  const ptTotal = personalTrainerFee * ptSessions;
  const subtotal = membershipSubtotal + ptTotal;
  const discountRate = months >= 12 ? 0.25 : months >= 6 ? 0.15 : 0;
  const discount = membershipSubtotal * discountRate;
  const amountDue = subtotal - discount;

  member.billed = true;
  member.plan = plan;
  member.months = months;
  member.amountPaid = amountDue;
  totalRevenue += amountDue;

  console.log("\n--- PHIEU THANH TOAN HOI VIEN ---");
  console.log(`Hoi vien: ${member.name}`);
  console.log(`Goi tap: ${plan} - ${months} thang`);
  console.log(`Phi goi tap: ${formatMoney(membershipSubtotal)}`);
  console.log(`Phi PT: ${ptSessions} buoi x ${formatMoney(personalTrainerFee)} = ${formatMoney(ptTotal)}`);
  console.log(`Tam tinh: ${formatMoney(subtotal)}`);
  console.log(`Chiet khau goi tap: ${Math.round(discountRate * 100)}% (${formatMoney(discount)})`);
  console.log(`Thanh toan: ${formatMoney(amountDue)}\n`);
}

async function checkInMember() {
  const card = (await ask("Quet ma the hoi vien: ")).trim().toUpperCase();
  if (!validMemberCard(card)) {
    console.log(
      `The khong hop le. Ma the phai bat dau bang GYM- va ket thuc bang ${new Date().getFullYear()}.\n`
    );
    return;
  }
  if (!registeredMembers.some((member) => member.card === card)) {
    console.log("Khong tim thay hoi vien da dang ky voi ma the nay.\n");
    return;
  }
  checkInCount += 1;
  console.log(`Check-in thanh cong: ${card}. Tong luot check-in: ${checkInCount}.\n`);
}

function printShiftReport() {
  console.log("\n" + "=".repeat(42));
  console.log("BAO CAO TONG KET CA TRUC");
  console.log("=".repeat(42));
  console.log(`So hoi vien dang ky: ${registeredMembers.length}`);
  console.log(`So hoi vien da thanh toan: ${registeredMembers.filter((member) => member.billed).length}`);
  console.log(`Tong luot check-in: ${checkInCount}`);
  console.log(`Tong doanh thu: ${formatMoney(totalRevenue)}`);
  console.log("=".repeat(42) + "\n");
}

async function main() {
  do {
    console.log("=== QUAN LY HOI VIEN GYM ===");
    console.log("1. Dang ky hoi vien moi");
    console.log("2. Tinh tien goi tap");
    console.log("3. Quet the check-in");
    console.log("4. Bao cao ca truc va thoat");
    const choice = (await ask("Chon chuc nang: ")).trim();

    switch (choice) {
      case "1":
        await registerMember();
        break;
      case "2":
        await calculateMembershipFee();
        break;
      case "3":
        await checkInMember();
        break;
      case "4":
        printShiftReport();
        running = false;
        break;
      default:
        console.log("Lua chon khong hop le. Vui long chon tu 1 den 4.\n");
    }
  } while (running);

  rl.close();
}

main().catch((error) => {
  console.error("Loi chuong trinh:", error);
  rl.close();
  process.exitCode = 1;
});
