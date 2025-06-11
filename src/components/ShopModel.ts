import { Model } from './base/Model';
import { IProduct, FormErrors, IShop, IOrder, IForm } from '../types';

export class ShopModel extends Model<IShop> {
	basket: string[] = [];
	catalog: IProduct[] = []; 
	order: IOrder = {
		payment: '',
		address: '',
		email: '',
		phone: '',
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
	}

	getTotal() {
		return this.basket.reduce(
			(a, c) => a + (this.catalog.find((it) => it.id === c)?.price ?? 0),
			0
		);
	}

	setCatalog(items: IProduct[]) {
		this.catalog = items; 
		this.emitChanges('items:render', { catalog: this.catalog });
	}

	setOrderField(field: keyof IForm, value: string) {
		this.order[field] = value;
		this.events.emit('order:changed', this.order);

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


