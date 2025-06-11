import { Component } from './base/Component';
import { IProduct } from '../types';
import { bem, createElement, ensureElement } from '../utils/utils';

interface ICardActions {
	onClick: (event: MouseEvent) => void;
}

export interface ICard<T> {
	title: string;
	description?: string | string[];
	image?: string;
	price: number | null;
	category?: string;
	index?: number;
}

export class Card<T> extends Component<ICard<T>> {
	protected _title: HTMLElement;
	protected _image?: HTMLImageElement;
	protected _description?: HTMLElement;
	protected _price: HTMLElement;
	protected _category?: HTMLElement;
	protected _index?: HTMLElement;
	protected _button?: HTMLButtonElement;

	constructor(container: HTMLElement, actions?: ICardActions) {
		super(container);

		this._title = ensureElement<HTMLElement>(`.card__title`, container);
		this._image = container.querySelector(`.card__image`);
		this._button = container.querySelector(`.card__button`);
		this._description = container.querySelector(`.card__description`);
		this._price = ensureElement<HTMLElement>(`.card__price`, container);
		this._category = container.querySelector(`.card__category`);
		this._index = container.querySelector(`.basket__item-index`);

		if (actions?.onClick) {
			if (this._button) {
				this._button.addEventListener('click', actions.onClick);
			} else {
				container.addEventListener('click', actions.onClick);
			}
		}
	}

	set id(value: string) {
		this.container.dataset.id = value;
	}

	set title(value: string) {
		this.setText(this._title, value);
	}

	set image(value: string) {
		this.setImage(this._image, value, this.title);
	}

	set description(value: string) {
		this.setText(this._description, value);
	}

	set price(value: number | null) {
		if (value) {
			this.setText(this._price, `${value} синапсов`);
		} else {
			this.setText(this._price, `Бесценно`);

			if (this._button) {
				this.setDisabled(this._button, true);
			}
		}
	}

	set category(value: string) {
		this.setText(this._category, value);

		this.toggleClass(
			this._category,
			'card__category_soft',
			value === 'софт-скил'
		);
		this.toggleClass(
			this._category,
			'card__category_hard',
			value === 'хард-скил'
		);
		this.toggleClass(
			this._category,
			'card__category_other',
			value === 'другое'
		);
		this.toggleClass(
			this._category,
			'card__category_additional',
			value === 'дополнительное'
		);
		this.toggleClass(
			this._category,
			'card__category_button',
			value === 'кнопка'
		);
	}

	set index(value: number) {
		this.setText(this._index, value);
	}

	set button(value: string) {
		this.setText(this._button, value);
	}
}
