const toVND = (value) => {
  value = value.toString().replace(/\./g, "");
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "VND",
  })
    .format(value)
    .replace("đ", "")
    .trim();

  return formatted;
};
const formatDonationValue = (donation, value) => {
  if (donation.typeOfDonation === "money") return toVND(value);
  const unit = donation.typeOfDonation === "clothes" ? "chiếc" : "cuốn";
  return `${value} ${unit}`;
};
module.exports = formatDonationValue;
