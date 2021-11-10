import * as XLSX from 'xlsx';
import { Sheet2JSONOpts, WorkSheet, ParsingOptions } from 'xlsx'
const { utils, read } = XLSX

export class XlsHelper { 
    public $utils = utils
    public WorkBookInst: XLSX.WorkBook
    constructor(buf: unknown, opts:ParsingOptions={}) {
        this.WorkBookInst = read(buf, opts)
    }

   /**
    * 
    * Get first/default sheet's JSON representation
    */
    public getJSON<T=unknown>(sheet?: WorkSheet,config:Sheet2JSONOpts={}): T[] {
        if (sheet) {
            return utils.sheet_to_json(sheet, config)
        } else {
            const defaultSheet = this.getFirstSheet()
            return utils.sheet_to_json(defaultSheet, config)
        }
 
    }

    public getHTML(sheet:WorkSheet) {
        return utils.sheet_to_html(sheet)
    }

    public getJSONBySheetName(name: string, opts: Sheet2JSONOpts): unknown {
        const sheet = this.getSheetByName(name)
        return utils.sheet_to_json(sheet, opts)
    }

    public getJSONByIndex(idx: string | number, config:Sheet2JSONOpts={}): unknown {
        const sheetNames = this.getSheetNames()
        const sheetName = sheetNames[Number(idx)]
        const sheet = this.getSheetByName(sheetName)
        return this.getJSON(sheet, config)
    }

    public getSheetByName(name): WorkSheet {
        const idx = this.getSheetIndexByName(name)
        if (idx >= 0) {
            const sheet = this.WorkBookInst.Sheets[name]
            return sheet
        } else {
            throw new Error(`Sheet with name '${name}' does not exist`)
        }
    }

    public getSheetByIndex(index: number) {
        const sheetNames = this.getSheetNames()
        if (index > sheetNames.length - 1) {
            throw new Error(`${index} is not  a valid index (max of ${sheetNames.length - 1})`)
        } else {
            const name = sheetNames[index]
            return this.getSheetByName(name)
        }
    }

    public getFirstSheet() {
        return this.getSheetByIndex(0)
    }

    public getWorkbook() {
        return this.WorkBookInst
    }
    

    public getSheetIndexByName(name: string) {
        return this.getSheetNames().indexOf(name)
    }

    public getSheetNames(): string[] {
        return this.WorkBookInst.SheetNames
    }

    public upload_to_stream(upload:any) {
        // const stream = createReadStream()
        // var buffers = [];
        // stream.on('data', function(data) { buffers.push(data); });
        // stream.on('end', function() {
        // var buffer = Buffer.concat(buffers);
      
    }
}