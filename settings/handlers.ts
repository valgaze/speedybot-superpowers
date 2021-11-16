import { BotHandler, $ } from 'speedybot'
import { XlsHelper } from './../src/util/xlsx'
import pretty from 'pretty'

/**
 * The handlers below use the following:
 * 
 * - SheetJS: https://www.npmjs.com/package/xlsx
 * - Speedybot $uperpowers (retrieve file bytes + metdata, set/clear contexts, call external integrations/resources, etc)
 * 
 * Behavior:
 * The user can attach a *.xlsx file and say "hey can you convert this to HTML for me?" (any variation of phrasing)
 * The agent will then set a context expecting the next file attachment to be *.xlsx
 * The user uploads an *.xlsx file
 * 
 * 
 * 
 */
const handlers: BotHandler[] = [
	{
		keyword: ['hi', 'hello', 'hey', 'yo', 'watsup', 'hola'],
		handler(bot, trigger) {
			const reply = `Heya how's it going ${trigger.person.displayName}?`
			bot.say(reply)

			// trigger the 'chips' handler
			$(bot).$trigger('chips', trigger)
		},
		helpText: `A handler that greets the user`
	},
	{
		keyword: ['sendfile', 'send pdf'],
		handler(bot, trigger) {
			const $bot = $(bot)

			// Supported filetypes: ['doc', 'docx' , 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'jpg', 'jpeg', 'bmp', 'gif', 'png']
			$bot.sendDataFromUrl('https://drive.google.com/uc?export=download&id=1VI4I4pYVVdMnB6YOQuSejVcrSwN0cotd')

			// Send file
			$bot.sendFile(__dirname, 'assets', 'speedybot.pdf')
		},
		helpText: `A handler that returns a file by two mechanism-- (1) with a publically-available link & (2) local file`
	},
	{
		keyword: ['ping', 'pong'],
		handler(bot, trigger) {
			const normalized = trigger.text.toLowerCase()
			if (normalized === 'ping') {
				bot.say('pong')
			} else {
				bot.say('ping')
			}
		},
		helpText: `A handler that says ping when the user says pong and vice versa`
	},
	{
		keyword: '<@submit>',
		handler(bot, trigger) {
			// Ex. From here data could be transmitted to another service or a 3rd-party integrationn
			bot.say(`Submission received! You sent us ${JSON.stringify(trigger.attachmentAction.inputs)}`)

		},
		helpText: `A special handler that fires anytime a user submits data (you can only trigger this handler by tapping Submit in a card)`
	},
	{
		keyword: /convert/gi,
		handler(bot,trigger) {
				const utterances = [`Ok, I'm waiting for your xlsx file`, `Sure-- just upload your *.xlsx file`, `Upload an *.xlsx`]
				$(bot).sendRandom(utterances)

				// Set the context
				$(bot).saveContext('expectXlxsfile')
		},
		helpText: `A 'primer' intent which will set context. The user can use any variation of "convert" and this intent will fire`
	},
	{
		keyword: '<@fileupload>',
		async handler(bot, trigger) {
				// take 1st file uploaded, note this is just a URL which requires auth to retrieve
				const [file] = trigger.message.files
				// check if the 'expectXlxsfile' context is active
				const expectXlxsfile = await $(bot).contextActive('expectXlxsfile')
				if (expectXlxsfile) {
					// Retrieve file data, note responseType is arraybufffer
					// arraybuffer: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer
					const fileData = await $(bot).getFile(file, {responseType: 'arraybuffer'})
					const {extension} = fileData
					if (extension === 'xlsx') {
						// If it's a *.xlsx file, convert the 1st sheet to html
						const inst = new XlsHelper(fileData.data)
						const sheet = inst.getFirstSheet()
						const html = inst.getHTML(sheet)

						// Return copy/paste'able HTML snippet
						const prettyed = pretty(html)
						bot.say({markdown: $(bot).htmlSnippet(prettyed)})

						// Send an actual html file (uses createReadStream)
						$(bot).sendDataAsFile(html, 'table_preview.html')
					} else {
						bot.say('Expected a file in *.xlsx format')
					}

					// Clear the 'expectXlxsfile' context
					$(bot).deleteContext('expectXlxsfile')
				} else {
					const fileData = await $(bot).getFile(file)
					const {extension, type} = fileData
					const supportedFiles = ['json', 'txt', 'csv']	
					if (supportedFiles.includes(extension)) {
						const { data } = fileData	
						// bot.snippet will format json or text data into markdown format
						bot.say({markdown: $(bot).snippet(data)})
					} else {
						if (extension === 'xlsx') {
							$(bot).sendRandom([`If you want to convert that spreadsheet to an HTML preview say 'convert to html' & attach the file`, 
											   `If you want that spreadsheet converted to html, say 'convert this file' & attach it to your message`,
											   `To start the conversion process (xlsx to html), say 'convert this spreadsheet' and attach the file`,
												`Say something like "convert this to html" and attach the spreadsheet file to have it converted`])
						} else {
							bot.say(`Sorrdy, somebody needs to add support for *.${extension} (${type}) files`)
						}
					}
				}
		}, 
		helpText: `Special handler that's fired when the user uploads a file to your bot (by default supports json/csv/txt.) If you use the word "convert", it will convert a spreadsheet (.xlsx) file to an html preview`
	},
	{
		keyword: 'debug',
		async handler(bot) {
			const contexts = await $(bot).getAllContexts()
			const msg = contexts.length ? `Active contexts: ${contexts.map(item => `"${item}"`).join(', ')}` : 'No active contexts'
			bot.say(msg)
		},
		helpText: 'Debug handler which will show active contexts'
	},
	{
		keyword: ['$', 'kitchensink', '$uperpowers', '$uperpower', '$superpower'],
		async handler(bot, trigger) {
       		// ## 0) Wrap the bot object in $ to give it $uperpowers, ex $(bot)
			const $bot = $(bot)

			// ## 1) Contexts: set, remove, and list
			// Contexts persist between "turns" of chat
			// Note: contexts can optionally store data
			// If you just need to stash information attached to a user, see "$(bot).saveData" below
			await $bot.saveContext('mycontext1')
			await $bot.saveContext('mycontext2', { data: new Date().toISOString()})

			const mycontext2 = await $bot.getContext('mycontext2')
			$bot.log('# mycontext2', mycontext2) // { data: '2021-11-05T05:03:58.755Z'}

			// Contexts: list active contexts
			const allContexts = await $bot.getAllContexts() // ['mycontext1', 'mycontext2']
			bot.say(`Contexts: ${JSON.stringify(allContexts)}`)

			// Contexts: check if context is active
			const isActive = await $bot.contextActive('mycontext1')
			$bot.log(`mycontext1 is active, ${isActive}`) // 'mycontext1 is active, true'

			// Contexts: remove context
			await $bot.deleteContext('mycontext1')

			const isStillActive = await $bot.contextActive('mycontext1')
			$bot.log(`mycontext1 is active, ${isStillActive}`) // 'mycontext1 is active, false'

			// ## 2) Helpers to add variation and rich content

			// sendRandom: Sends a random string from a list
			$bot.sendRandom(['Hey!','Hello!!','Hiya!'])

			// sendTemplate: like sendRandom but replace $[variable_name] with a value
			const utterances = ['Hey how are you $[name]?', `$[name]! How's it going?`, '$[name]']
			const template = { name: 'Joey'}
			$bot.sendTemplate(utterances, template)

			// sendURL: Sends a URL in a clickable card
			$bot.sendURL('https://www.youtube.com/watch?v=3GwjfUFyY6M', 'Go Celebrate')

			// snippet: Generate a snippet that will render data in markdown-friendly format
			const JSONData = {a: 1, b:2, c:3, d:4}

			$bot.sendSnippet(JSONData, `**Here's some JSON, you'll love it**`) // send to room

			// Snippet to a specifc room or specific email
			// const snippet = $bot.snippet(JSONData)
			// $bot.send({markdown: snippet, roomId:trigger.message.roomId, text: 'Your client does not render markdown :('}) // send to a specific room
			// $bot.send({markdown: snippet, toPersonEmail:'joe@joe.com', text: 'Your client does not render markdown :('}) // send to a specific person

			// ## 3) Save data between conversation "runs"

			interface SpecialUserData {
				specialValue: string;
				userId: String;
			}
			const specialData:SpecialUserData = {
				specialValue: Math.random().toString(36).slice(2),
				userId: trigger.personId,
			}
			
			// Save the data
			await $bot.saveData<SpecialUserData>('userData', specialData)
			
			// Retrieve the data (returns null if does not exist)
			const dataRes = await $bot.getData<SpecialUserData>('userData')

			if (dataRes) {
				// These are now "typed"
				const theValue = dataRes.specialValue
				const id = dataRes.userId
				$bot.log(`Your specal value was ${theValue} and your id is ${id}`)

				// destroy data
				$bot.deleteData('userData')
			}

			// ## 4) Integrate with 3rd-parties: $bot.get, $bot.post, etc

			// ex. get external data
			// Opts are axios request config (for bearer tokens, proxies, unique config, etc)
			const res = await $bot.get('https://randomuser.me/api/')
			bot.say({markdown: $bot.snippet(res.data)})

			// ## 4) Files & attachments

			// Send a local file
			// Provide a path/filename, will be attached to message
			// $bot.sendFile(__dirname, 'assets', 'speedybot.pdf')

			// Send a publically accessible URL file
			// Supported filetypes: ['doc', 'docx' , 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'jpg', 'jpeg', 'bmp', 'gif', 'png']
			$bot.sendDataFromUrl('https://speedybot.valgaze.com')

			// // experimental (fileystem write): send arbitrary JSON back as a file
			// $bot.sendDataAsFile(JSON.stringify({a:1,b:2}), '.json')

			// For an example involving parse'able spreadsheets (.xlsx), see here: https://github.com/valgaze/speedybot-superpowers
		},
		helpText: 'A demo of $uperpowers'
	},
	{
		keyword: 'chips',
		async handler(bot) {
			const $bot = $(bot)
			$bot.sendChips(['hey', 'ping', '$', 'pong', { 
				label: 'custom chip', 
				handler(bot, trigger) {
					$bot.sendSnippet(trigger, `**The 'custom chip' was tapped**	`)
					$bot.$trigger('chips', trigger)
				}
			}], 'Pick an option below')
		},
		helpText: 'Returns a sample list of "chips"'
	}
]

export default handlers;