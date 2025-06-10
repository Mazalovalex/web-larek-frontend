import { Model } from './base/Model';
import {
	IProduct,
	FormErrors,
	IShop,
	IBasketItem,
	IOrder,
	IForm,
} from '../types';

export class Product extends Model<IProduct> {
	description: string;
	id: string;
	image: string;
	title: string;
	category: string;
	price: number | null;
	index: number;
}

export class ShopModel extends Model<IShop> {
	basket: string[] = [];
	catalog: Product[];
	order: IOrder = {
		payment: '',
		address: '',
		email: '',
		phone: '',
		total: 0,
		items: [],
	};
	formErrors: FormErrors = {};

	toggleOrdered(id: string, action: 'Add' | 'Remove') {
		if (action === 'Add') {
			if (!this.basket.includes(id)) {
				this.basket.push(id);
			}
		} else {
			this.basket = this.basket.filter((basketItem) => basketItem !== id);
		}

		this.events.emit('basket:changed');
	}

	clearBasket() {
		this.basket = [];
		this.events.emit('basket:changed');
	}

	clearOrder() {
		this.order.payment = '';
		this.order.address = '';
		this.order.email = '';
		this.order.phone = '';
		this.order.total = 0;
		this.order.items = [];
	}

	getTotal() {
		return this.basket.reduce(
			(a, c) => a + this.catalog.find((it) => it.id === c).price,
			0
		);
	}

	setCatalog(items: IProduct[]) {
		this.catalog = items.map((item) => new Product(item, this.events));
		this.emitChanges('items:render', { catalog: this.catalog });
	}

	setOrderField(field: keyof IForm, value: string) {
		this.order[field] = value;

		if (this.validateOrder()) {
			this.events.emit('order:ready', this.order);
		}
	}

	validateOrder() {
		const errors: typeof this.formErrors = {};
		if (!this.order.payment || !this.order.address) {
			if (!this.order.payment) {
				errors.payment = 'Необходимо указать метод оплаты';
			}
			if (!this.order.address) {
				errors.address = 'Необходимо указать адрес';
			}
		} else {
			if (!this.order.email) {
				errors.email = 'Необходимо указать email';
			}
			if (!this.order.phone) {
				errors.phone = 'Необходимо указать телефон';
			}
		}

		this.formErrors = errors;
		this.events.emit('formErrors:change', this.formErrors);
		return Object.keys(errors).length === 0;
	}
}
