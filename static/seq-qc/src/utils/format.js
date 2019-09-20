/**
 * Returns a Date object in the form of a string, e.g. '2019-09-15 08:17'
 *
 * @param date, Date
 * @returns {string}
 */
export function unixTimeStringToDateString(timeStampString){
    var date = new Date(parseInt(timeStampString, 10));

    const year = date.getFullYear();
    const month = (date.getMonth()+1).toString(10).padStart(2,'0');
    const day = date.getDate();
    const hour = date.getHours();
    const min = date.getMinutes();

    return `${year}-${month}-${day} ${hour}:${min}`
}