import { Form } from './common/Form';
import { IOrderForm, IContactsForm } from '../types';
import { EventEmitter, IEvents } from './base/events';
import { ensureElement } from '../utils/utils';

export class Order extends Form<IOrderForm> {
	protected _address: HTMLInputElement;
	protected _online: HTMLButtonElement;
	protected _offline: HTMLButtonElement;

	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);

		this._online = this.container.elements.namedItem(
			'online'
		) as HTMLButtonElement;
		this._offline = this.container.elements.namedItem(
			'offline'
		) as HTMLButtonElement;
		this._address = this.container.elements.namedItem(
			'address'
		) as HTMLInputElement;

		this._online.addEventListener('click', () =>
			this.events.emit('order.payment:change', {
				field: 'payment',
				value: 'онлайн',
			})
		);
		this._offline.addEventListener('click', () =>
			this.events.emit('order.payment:change', {
				field: 'payment',
				value: 'офлайн',
			})
		);

		this.container.addEventListener('submit', (e) => {
			e.preventDefault();
			this.events.emit('order:submit');
		});
	}

	set payment(value: string) {
		this.toggleClass(this._online, 'button_alt-active', value === 'онлайн');
		this.toggleClass(this._online, 'button_alt', value !== 'онлайн');
		this.toggleClass(this._offline, 'button_alt-active', value === 'офлайн');
		this.toggleClass(this._offline, 'button_alt', value !== 'офлайн');
	}

	set address(value: string) {
		this._address.value = value;
	}
}

export class Contacts extends Form<IContactsForm> {
	protected _phone: HTMLInputElement;
	protected _email: HTMLInputElement;

	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);

		this._phone = this.container.elements.namedItem(
			'phone'
		) as HTMLInputElement;
		this._email = this.container.elements.namedItem(
			'email'
		) as HTMLInputElement;
	}

	set phone(value: string) {
		this._phone.value = value;
	}

	set email(value: string) {
		this._email.value = value;
	}
}
