import { BehaviorSubject, Subscribable, Observer, Subscription, PartialObserver } from "rxjs";
import { KeyValuePair } from "./key-value-pair.model";

export class Signal implements Subscribable<KeyValuePair<string, any>>, Observer<KeyValuePair<string, any>>
{
    private readonly values: BehaviorSubject<KeyValuePair<string, any>>;
    private count = 0;
    constructor(
        public readonly name: string
    ) {
        this.values = new BehaviorSubject<KeyValuePair<string, any>>({ key: name, value: undefined });
    }

    private increment() {
        this.count++;
    }

    public decrement() {
        this.count--;
    }

    public get referenceCount() {
        return this.count;
    }

    public subscribe(observer?: PartialObserver<KeyValuePair<string, any>>): Subscription;
    public subscribe(next: null, error: null, complete: () => void): Subscription;
    public subscribe(next: null, error: (error: any) => void, complete?: () => void): Subscription;
    public subscribe(next: (value: KeyValuePair<string, any>) => void, error: null, complete: () => void): Subscription;
    public subscribe(next?: (value: KeyValuePair<string, any>) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    public subscribe(next?: any, error?: any, complete?: any): Subscription {
        this.increment();
        const subscription = this.values.subscribe(next, error, complete)
            .add(() => {
                this.decrement();
                if (this.count <= 0) {
                    if (this.onUnsubscribe) {
                        subscription.unsubscribe();
                        this.onUnsubscribe(this.name);
                    }
                }
            });
        return subscription;
    }

    public get closed() {
        return this.values.closed;
    }

    public next = (value: KeyValuePair<string, any>) => {
        this.values.next(value);
    };

    public error = (err: any) => {
        this.values.error(err);
    };

    public complete = () => {
        this.values.complete();
    };

    public onUnsubscribe: (name: string) => void;

}