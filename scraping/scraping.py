import newspaper

article = newspaper.article('https://www.simplilearn.com/business-consultant-job-description-article')

print(article.authors)

print(article.publish_date)

print(article.text)

article.nlp()
print(article.keywords)

print(article.summary)