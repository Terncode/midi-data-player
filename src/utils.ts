export class BufferUtils {
    static bufferToNumber(buffer: Buffer | number[]) {
        return this.hexToNumber(this.bufferToHex(buffer));
    }
    static bufferToString(buffer: Buffer) {
        let data = '';
        for (let i = 0; i < buffer.length; i++) {
            data += String.fromCharCode(buffer[i]);
        }
        return data;
    }
    static hexToNumber(hexString: string) {
        return parseInt(hexString, 16);
    }
    static bufferToHex(buffer: Buffer | number[]) {
        let hex = '';
        for (let i = 0; i < buffer.length; i++) {
            hex += this.byteToHex(buffer[i]);
        }
        return hex;
    }
    static byteToHex(byte: number) {
        const value = `0${byte.toString(16)}`;
        return value.slice(-2);
    }
    static getVarIntLength(buffer: Buffer) {
        let currentByte = buffer[0];
        let byteCount = 1;

        while (currentByte >= 128) {
            currentByte = buffer[byteCount];
            byteCount++;
        }

        return byteCount;
    }
    static readVarInt(buffer: Buffer) {
        let result = 0;
        for (let i = 0; i < buffer.length; i++) {
            const b = buffer[i];
            if (b & 0x80) {
                result += (b & 0x7f);
                result <<= 7;
            } else {
                result += b;
            }
        }
        return result;
    }

}