export interface IProduct {
	id: string;
	title: string;
	category: string;
	description?: string;
	image: string;
	price: number | null;
}

export interface IBasketItem extends IProduct {
  index: number;
}

export interface IOrderForm {
	payment: string;
	address: string;
}

export interface IContactsForm {
	email: string;
	phone: string;
}

export interface IForm extends IOrderForm, IContactsForm {}

export interface IOrder extends IForm {
	total?: number;
	items?: string[];
}

export type FormErrors = Partial<Record<keyof IOrder, string>>;

export interface IOrderResult {
	id: string;
}

export interface IShop {
	catalog: IProduct[];
	basket: string[];
	order: IOrder | null;
}
