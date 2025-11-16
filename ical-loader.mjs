const TAG_NAME = 'ical-loader';
customElements.define(
		TAG_NAME,
		class iCalLoader extends HTMLElement {
				static TAG_NAME = TAG_NAME;

				static get observedAttributes() {
						return [];
				}

				static __registerElement() {
						customElements.define(TAG_NAME, iCalLoader);
				}

				#messageAreaElm;

				constructor() {
						super();
						this.attachShadow({ mode: 'open' });
						this._initDom(this.shadowRoot);
						this._attachEventListeners();
				}

				attributeChangedCallback(name, oldValue, newValue) {
						if(oldValue === newValue) return;
						console.debug('Attribute changed', name, oldValue, newValue);
						switch(name) {
						default:
								console.error('Unknown attribute');
						}
				}

				render() {
						//const clone2 = template.content.cloneNode(true)
						let template = document.createElement('div'),
								styles = document.createElement('style');
						template.innerHTML = iCalLoader.html;
						styles.textContent = iCalLoader.css;
						return [styles, ...Array.prototype.slice.call(template.childNodes).filter(n => !(n instanceof Text))];
				}

				_initDom(rootElem) {
						rootElem.append(...this.render());
						this.#messageAreaElm = this.shadowRoot.getElementById('messageArea');
						return this;
				}

				_attachEventListeners() {
						this.shadowRoot.getElementById('icsFile').addEventListener('change', this._handleFileSelect.bind(this), false);
						return this;
				}

				async _handleFileSelect(event) {
						const file = event.target.files[0];
						if (!file) return;

						const reader = new FileReader();

						this._setMessage('<p class="message-info">Parsing your calendar...</p>');

						reader.addEventListener('load', (e) => {
								let iCalEvents = this._parseEvents(e.target.result);

								if (iCalEvents.length === 0) {
										this._setMessage(`
												<p class="message-error">No events found in this file or</p>
												<p class="message-error">Could not parse the file. Please ensure it is a valid .ics file.</p>
										`);
										return;
								}

								this._setMessage(`<p class="message-info">Rendering ${iCalEvents.length} events...</p>`);

								iCalEvents.chunk(iCalEvent => {
										 this._fireiCalEvent(iCalEvent);
								}, 50).then(() =>{
										this._setMessage('');
								});
						});

						reader.readAsText(file);
				}

				_fireiCalEvent(e) {
						document.body.dispatchEvent(new CustomEvent('ical-event', {detail: {icalEvent:e}}));
						return this;
				}

				_setMessage(msg) {
						this.#messageAreaElm.innerHTML = msg;
						return this;
				}

				_addMessage(msg) {
						this.#messageAreaElm.innerHTML += msg;
						return this;
				}

				_parseEvents(file) {
						let events = []
						try {
								events = new ICAL.Component(ICAL.parse(file)).getAllSubcomponents('vevent').map(ve => {
										return new ICAL.Event(ve);
								});
						} catch (err) {
								console.error('Error parsing iCalendar file:', err);
								events = [];
						}

						return events;
				}

				static css = `
						.container {
								max-width: 72rem; /* 1152px */
								margin-left: auto;
								margin-right: auto;
								padding: 1rem;
						}

						.page-header {
								background-color: #ffffff;
								box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
								border-radius: 0.5rem;
								padding: 1.5rem;
								margin-bottom: 2rem;
						}
						.page-header h1 {
								font-size: 1.875rem;
								font-weight: 700;
								color: #1F2937;
								margin: 0;
						}
						.page-header p {
								color: #4B5563;
								margin-top: 0.5rem;
						}
						.file-input-container {
								margin-top: 1.5rem;
						}
						.file-input-wrapper {
								position: relative;
								overflow: hidden;
								display: inline-block;
								cursor: pointer;
						}
						.file-input-wrapper input[type=file] {
								font-size: 100px;
								position: absolute;
								left: 0;
								top: 0;
								opacity: 0;
								cursor: pointer;
						}
						.file-input-button {
								cursor: pointer;
								background-color: #2563EB;
								color: #ffffff;
								font-weight: 600;
								padding: 0.5rem 1rem;
								border-radius: 0.5rem;
								box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
								transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
						}
						.file-input-button:hover {
								background-color: #1D4ED8;
						}

						#messageArea {
								text-align: center;
								padding: 1rem;
						}
						.message-info {
								font-size: 1.125rem;
								color: #2563EB;
						}
						.message-error {
								font-size: 1.125rem;
								color: #DC2626;
						}
						.message-error-details {
								font-size: 0.875rem;
								color: #6B7280;
								margin-top: 0.5rem;
						}
						/* --- Utility Classes --- */
						.hidden {
								display: none;
						}
						/* --- Responsive Grid --- */
						@media (min-width: 768px) {
								.container {
										padding: 2rem;
								}
						}
				`;

				static html = `
				<div class="container">
						<header class="page-header">
								<h1>iCalendar (.ics) Event Viewer</h1>
								<p>Upload your .ics file to see all the events listed as cards below.</p>

								<!-- Styled File Input -->
								<div class="file-input-container">
										<label for="icsFile" class="file-input-wrapper">
												<span class="file-input-button">
														Select .ics File
												</span>
												<input type="file" id="icsFile" accept=".ics,text/calendar">
										</label>
								</div>
						</header>

						<!-- Message Area for loading or errors -->
						<div id="messageArea" class="text-center p-4"></div>
				</div>
				`;
		}
);
export default customElements.get(TAG_NAME);
