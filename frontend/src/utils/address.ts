export function addressAbbreviation(address: string, tailLength: number) {
  return address.substring(0,8) + "..." + address.substring(address.length - tailLength, address.length);
}

export function hexAbbreviation(address: string, tailLength: number) {
  return address.substring(0,3) + "..." + address.substring(address.length - tailLength, address.length);
}
