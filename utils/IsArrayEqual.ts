/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */
export default function hasDuplicates(array : any) {
    var valuesSoFar = Object.create(null);
    for (var i = 0; i < array.length; ++i) {
        var value = array[i].name;
        if (value in valuesSoFar) {
            return true;
        }
        valuesSoFar[value] = true;
    }
    return false;
}