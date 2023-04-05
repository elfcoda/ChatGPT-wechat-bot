import LevelUP from 'levelup';
import LevelDOWN from 'leveldown';

export interface levelDBAllResult<VT = any> {
  [key: string]: VT
}

export default class LevelDB {
  private db: any = null
  private dbName: string = './mydb'

  constructor () {
    try {
      // connect to DB
      this.db = LevelUP(LevelDOWN(this.dbName));
    } catch (error) {
      console.log(error);
      throw error
    }
  }

  // insert or update
  async add(prefix: string, key: string, value: any, callback: any = null): Promise<void> {
    const dbKey: string = prefix + "_" + key
    const dbValue: string = JSON.stringify(value)

    await this.db.put(dbKey, dbValue, function (err) {
      console.error("DB write error: ", err)
      if (callback !== null && typeof(callback) === "function") {
        callback(err)
      }

      throw new Error(err)
    });
  }

  // query
  async get(prefix: string, key: string, callback: any = null): Promise<any> {
    const dbKey: string = prefix + "_" + key

    const dbValue = await this.db.get(dbKey, function (err) {
      console.error("DB query error: ", err)
      if (callback !== null && typeof(callback) === "function") {
        callback(err)
      }

      throw new Error(err)
    })

    return JSON.parse(dbValue.toString())
  }

  // query all
  async getAll(prefix: string, callback: any = null): Promise<levelDBAllResult> {
    const dbPrefix: string = prefix + "_"
    const dbPrefixLT: string = dbPrefix + "~"

    let resultSet: levelDBAllResult = {}

    await this.db.createReadStream({ gt: dbPrefix, lt: dbPrefixLT })
      .on('data', (data) => {
        resultSet[data.key.toString().replace(dbPrefix, "")] = JSON.parse(data.value.toString())
      })
      .on('error', (err) => {
        console.error("Error reading data from LevelDB: ", err)
        if (callback !== null && typeof(callback) === "function") {
          callback(err)
        }

        throw new Error(err)
      })
      .on('end', () => {
        console.log("All data with prefix ", dbPrefix, " has been read")
      })

      return resultSet
  }

  // delete
  async delete(prefix: string, key: string, callback: any = null): Promise<void> {
    const dbKey: string = prefix + "_" + key

    await this.db.del(dbKey, function (err) {
      console.error("DB delete error: ", err)
      if (callback !== null && typeof(callback) === "function") {
        callback(err)
      }

      throw new Error(err)
    })
  }
}

const test: LevelDB = new LevelDB()
await test.getAll("key")
