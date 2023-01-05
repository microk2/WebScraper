export const generateFileName = (name: string) => {
  const _Date = new Date();

  const year = _Date.getFullYear();
  const month =
    _Date.getMonth() + 1 < 10
      ? `0${_Date.getMonth() + 1}`
      : _Date.getMonth() + 1;
  const day = _Date.getDate() < 10 ? `0${_Date.getDate()}` : _Date.getDate();
  const yearMonthDay = `${year}${month}${day}`;

  const hour =
    _Date.getHours() < 10 ? `0${_Date.getHours()}` : _Date.getHours();
  const minutes =
    _Date.getMinutes() < 10 ? `0${_Date.getMinutes()}` : _Date.getMinutes();
  const seconds =
    _Date.getSeconds() < 10 ? `0${_Date.getSeconds()}` : _Date.getSeconds();
  const hourMinutesSeconds = `${hour}${minutes}${seconds}`;

  if (!name) name = "";
  else name = `${name}_`;

  return `${name}${yearMonthDay}_${hourMinutesSeconds}.sql`;
};
